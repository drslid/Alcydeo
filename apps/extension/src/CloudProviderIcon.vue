<script setup lang="ts">
import type{CloudProvider}from'../../../packages/cloud/contracts';
defineProps<{provider:CloudProvider}>();
</script>
<template>
 <svg class="cloud-provider-icon" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
  <template v-if="provider === 'drive'">
   <path fill="#34a853" d="M19 5h10L12 35H2z"/><path fill="#fbbc04" d="m29 5 17 30H35L19 5z"/><path fill="#4285f4" d="M12 25h28l6 10-6 9H7L2 35z"/><path fill="#188038" d="m2 35 10-10 6 10H2z"/><path fill="#1967d2" d="m35 25 11 10H29z"/>
  </template>
  <template v-else-if="provider === 'onedrive'">
   <path fill="#185abd" d="M10 25a13 13 0 0 1 24-12 11 11 0 0 1 9 18H11z"/><path fill="#0364b8" d="M4 24a10 10 0 0 1 15-5l9 5-9 15H11A10 10 0 0 1 4 24"/><path fill="#0078d4" d="m19 19 9 5 7-3a10 10 0 0 1 10 15l-17 3H19z"/><path fill="#28a8ea" d="m19 29 9-5 17 12a10 10 0 0 1-8 4H12z"/>
  </template>
  <template v-else-if="provider === 'megaup'">
   <rect x="2" y="2" width="44" height="44" rx="14" fill="#226bd1"/><path d="M11 34V14h6l7 11 7-11h6v20h-6V24l-7 10-7-10v10z" fill="white"/>
  </template>
  <template v-else-if="provider === 'onefichier'">
   <rect x="2" y="2" width="44" height="44" rx="14" fill="#cf3038"/><path d="M16 16l9-5h5v25H15v-5h8V19l-5 3z" fill="white"/>
  </template>
  <template v-else-if="provider === 'turbobit'">
   <rect x="2" y="2" width="44" height="44" rx="14" fill="#ed7423"/><path d="M10 12h28v6H27v19h-6V18H10z" fill="#fff"/>
  </template>
  <template v-else-if="provider === 'pcloud'">
   <rect x="2" y="2" width="44" height="44" rx="14" fill="#149fc5"/><path d="M15 35V13h10a8 8 0 0 1 0 16h-5v6z M20 18v6h5a3 3 0 0 0 0-6z" fill="white" fill-rule="evenodd"/>
  </template>
  <template v-else>
   <rect x="2" y="2" width="44" height="44" rx="14" fill="#f4c84a"/><path d="M33 18a12 12 0 1 0 1 13v-8H23v5h6a7 7 0 1 1-1-10z" fill="#26323c"/>
  </template>
 </svg>
</template>
