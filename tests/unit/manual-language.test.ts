import{test,expect}from'vitest';import{messageText,supportedLanguages}from'../../packages/i18n/manual';import{pcloudDestination}from'../../packages/cloud/pcloud';
test('manual catalog messages preserve positional values, named placeholders and literal dollars',()=>{
 expect(messageText({message:'$COUNT$ fichiers · $2 · $$',placeholders:{count:{content:'$1'}}},['2','vidéo'])).toBe('2 fichiers · vidéo · $');
 expect(messageText({message:'$1 / $2'},['مرحبا'])).toBe('مرحبا / ');expect(supportedLanguages).toHaveLength(10);
});
test('pCloud EU hash-route deposit links retain the code and force the correct datacentre',()=>{
 expect(pcloudDestination('https://e.pcloud.com/#/puplink?code=Fixture123','us')).toEqual({code:'Fixture123',region:'eu'});
 expect(pcloudDestination('https://my.pcloud.com/#page=puplink&code=Fixture123','us')).toEqual({code:'Fixture123',region:'us'});
});
test.each(['https://e.pcloud.com/#/publink?code=Fixture123','https://e.pcloud.com.evil.test/#/puplink?code=Fixture123','https://e.pcloud.com/#/puplink?code=Fixture123&code=Other123','http://e.pcloud.com/#/puplink?code=Fixture123'])('invalid pCloud form is rejected: %s',url=>expect(()=>pcloudDestination(url,'eu')).toThrow('cloudPcloudLink'));
