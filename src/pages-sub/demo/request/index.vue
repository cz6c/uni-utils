<route lang="json5">
{
  style: {
    navigationBarTitleText: '请求示例',
  },
}
</route>

<template>
  <view class="bg-white overflow-hidden px-3">
    <!-- 文件上传 -->
    <UploadComp />
  </view>
</template>

<script lang="ts" setup>
import UploadComp from './components/upload.vue'
</script>

<style lang="scss" scoped>
.test-css {
  // mt-4=>1rem=>16px;
  margin-top: 16px;
}
</style>
