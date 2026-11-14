<script setup lang="ts">
import symbols from '../../../packages/design-tokens/icons/material.json';
defineProps<{name:string}>();
const icons=symbols as Record<string,{viewBox:string;paths:{d:string;fillRule?:'nonzero'|'evenodd'}[]}>;
</script>
<template><svg class="material-symbol" :class="{directional:name === 'arrow' || name === 'chevron'}" :viewBox="(icons[name] ?? icons.arrow)!.viewBox" fill="currentColor" aria-hidden="true" focusable="false"><path v-for="(path,index) in (icons[name] ?? icons.arrow)!.paths" :key="index" :d="path.d" :fill-rule="path.fillRule" /></svg></template>
