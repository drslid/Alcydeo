import{describe,it,expect}from'vitest';
import{noSetupCloudProviders,cloudFileLimit,planCloudTargets}from'../../packages/cloud/destinations';
describe('Cloud destinations without additional configuration',()=>{
 it('includes only the four explicit guest-sharing destinations',()=>expect(noSetupCloudProviders).toEqual(['gofile','megaup','onefichier','turbobit']));
 it('keeps a compatible file eligible everywhere without pCloud',()=>expect(planCloudTargets(200_000_000,noSetupCloudProviders)).toEqual({send:[...noSetupCloudProviders],tooLarge:[]}));
 it('skips only Turbobit above its local limit',()=>expect(planCloudTargets(200_000_001,noSetupCloudProviders)).toEqual({send:['gofile','megaup','onefichier'],tooLarge:['turbobit']}));
 it('honors the MegaUp and 1fichier boundaries independently',()=>{
  expect(planCloudTargets(cloudFileLimit('megaup')+1,noSetupCloudProviders)).toEqual({send:['gofile','onefichier'],tooLarge:['megaup','turbobit']});
  expect(planCloudTargets(cloudFileLimit('onefichier')+1,noSetupCloudProviders)).toEqual({send:['gofile'],tooLarge:['megaup','onefichier','turbobit']});
 });
 it('does not prepare committed destinations again or mutate its inputs after a partial failure',()=>{
  const targets=[...noSetupCloudProviders,'gofile']as const,prepared=['gofile','onefichier','turbobit']as const;
  expect(planCloudTargets(525622,targets,prepared)).toEqual({send:['megaup'],tooLarge:[]});expect(targets).toHaveLength(5);expect(prepared).toHaveLength(3);
 });
 it.each([0,-1,NaN,Infinity,1.5])('rejects an invalid size %s before creating jobs',size=>expect(()=>planCloudTargets(size,noSetupCloudProviders)).toThrow('invalid'));
});
