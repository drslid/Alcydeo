// Download containers are separate from the codecs the local editor can decode.
export const videoExtensions=['mp4','webm','m4v','mkv','ts','mov','avi','ogg','mpg','mpeg','wmv','flv','3gp','m2ts','mts'] as const;
export const audioExtensions=['mp3','aac','m4a','flac','wav'] as const;
export const directExtensions=[...videoExtensions,...audioExtensions] as const;
export const mediaSuffix=`\\.(${[...directExtensions,'m3u8','mpd'].join('|')})(?:[?#]|$)`;
export const mediaLink=new RegExp(mediaSuffix,'i');
export const formatMime:Record<string,string>={mp4:'video/mp4',webm:'video/webm',m4v:'video/x-m4v',mkv:'video/x-matroska',ts:'video/mp2t',mov:'video/quicktime',avi:'video/x-msvideo',ogg:'audio/ogg',mpg:'video/mpeg',mpeg:'video/mpeg',wmv:'video/x-ms-wmv',flv:'video/x-flv','3gp':'video/3gpp',m2ts:'video/mp2t',mts:'video/mp2t',mp3:'audio/mpeg',aac:'audio/aac',m4a:'audio/mp4',flac:'audio/flac',wav:'audio/wav'};
