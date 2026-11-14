<script setup lang="ts">
import{onMounted,onUnmounted,ref}from'vue';import PlaylistBatchCard from'./PlaylistBatchCard.vue';import{api}from'./api';import{t}from'./i18n';import type{Task}from'../../../packages/contracts';import type{PlaylistBatchView}from'../../../packages/playlists/contracts';
defineProps<{tasks:Task[]}>();const jobs=ref<PlaylistBatchView[]>([]);let timer:ReturnType<typeof setInterval>,busy=false,disposed=false;
async function refresh(){if(busy||disposed)return;busy=true;try{const data=await api<PlaylistBatchView[]>('youtubePlaylistList');if(!disposed)jobs.value=data;}catch{/* A worker restart is retried by the next refresh. */}finally{busy=false;}}
onMounted(()=>{void refresh();timer=setInterval(()=>{void refresh();},2000);});onUnmounted(()=>{disposed=true;clearInterval(timer);});
</script>
<template><section v-if="jobs.length" class="playlist-batches" :aria-label="t('playlistTitle')"><PlaylistBatchCard v-for="job in jobs" :key="job.id" :job="job" :tasks="tasks" @changed="refresh" /></section></template>
