import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
export default defineConfig({
  site:'https://drslid.github.io', base:'/Alcydeo', output:'static', trailingSlash:'always',
  integrations:[starlight({
    title:'Alcydeo', defaultLocale:'en',
    disable404Route:true,
    logo:{src:'./src/assets/kingfisher-icon.svg',alt:'Alcydeo'},
    social:[{icon:'github',label:'Alcydeo on GitHub',href:'https://github.com/drslid/Alcydeo'}],
    head:[
      {tag:'meta',attrs:{name:'theme-color',content:'#071B2D'}},
      {tag:'meta',attrs:{property:'og:image',content:'https://drslid.github.io/Alcydeo/images/social.png'}},
      {tag:'meta',attrs:{name:'twitter:card',content:'summary_large_image'}},
    ],
    customCss:['./src/styles/custom.css'],
    locales:{en:{label:'English',lang:'en'},es:{label:'Español',lang:'es'},fr:{label:'Français',lang:'fr'},de:{label:'Deutsch',lang:'de'},'zh-cn':{label:'简体中文',lang:'zh-CN'},ar:{label:'العربية',lang:'ar',dir:'rtl'},ru:{label:'Русский',lang:'ru'},pt:{label:'Português',lang:'pt'},hi:{label:'हिन्दी',lang:'hi'},ur:{label:'اردو',lang:'ur',dir:'rtl'}},
    sidebar:[{autogenerate:{directory:'guides'}}],
  })],
});
