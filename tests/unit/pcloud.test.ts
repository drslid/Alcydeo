import{describe,it,expect}from'vitest';
import{pcloudDestination,pcloudResult}from'../../packages/cloud/pcloud';
describe('pCloud public upload links',()=>{
 it('extracts only the upload-link code and keeps the chosen data region',()=>{
  expect(pcloudDestination(' https://my.pcloud.com/#page=puplink&code=localCode_123 ','eu')).toEqual({code:'localCode_123',region:'eu'});
  expect(pcloudDestination('localCode_123','us')).toEqual({code:'localCode_123',region:'us'});
 });
 it.each(['https://my.pcloud.com/publink/show?code=download','https://my.pcloud.com/#page=publink&code=download','https://my.pcloud.com.attacker.test/#page=puplink&code=local123','http://my.pcloud.com/#page=puplink&code=local123','https://u:p@my.pcloud.com/#page=puplink&code=local123','https://my.pcloud.com/#page=puplink&code=first&code=second','../upload?code=local123','x'])('rejects a download link or invalid destination: %s',value=>{
  expect(()=>pcloudDestination(value,'eu')).toThrow('cloudPcloudLink');
 });
 it('requires an explicit supported region',()=>expect(()=>pcloudDestination('local123','any')).toThrow('cloudPcloudLink'));
 it('requires the official numeric success result and checks metadata if present',()=>{
  expect(()=>pcloudResult({result:0},100)).not.toThrow();
  expect(()=>pcloudResult({result:0,metadata:[{size:100}]},100)).not.toThrow();
  for(const data of [{result:'0'},{},null,{result:0,metadata:[]},{result:0,metadata:[{size:99}]}])expect(()=>pcloudResult(data,100)).toThrow('cloudResponse');
 });
 it('distinguishes invalid links, expiration, quota and service errors',()=>{
  for(const[code,error]of [[7002,'cloudPcloudLink'],[7004,'cloudExpired'],[7007,'cloudPcloudQuota'],[7008,'cloudPcloudQuota'],[4000,'cloudRate'],[5000,'cloudNetwork']]as const)expect(()=>pcloudResult({result:code},100)).toThrow(error);
 });
});
