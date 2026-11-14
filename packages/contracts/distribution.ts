declare const __ALCYDEO_LOCAL__:boolean;
export const LOCAL_BUILD=typeof __ALCYDEO_LOCAL__!=='undefined'&&__ALCYDEO_LOCAL__;
// A build-time choice, never a hidden runtime switch in the Store package.
export const isLocalBuild=()=>typeof __ALCYDEO_LOCAL__!=='undefined'&&__ALCYDEO_LOCAL__;
export const youtubeHost=(hostname:string)=>/(^|\.)(youtube\.com|youtu\.be|youtube-nocookie\.com|googlevideo\.com)$/.test(hostname);
