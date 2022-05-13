<template>
  <div>
    <el-upload
      class="w-32 h-32"
      :show-file-list="false"
      :drag="true"
      :auto-upload="false"
      :on-change="uploadChange"
    >
      <img v-if="imageUrl" :src="imageUrl" class="avatar" />
      <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
    </el-upload>
    <div class="a">
      <div class="bbb">
        test
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UploadProps } from 'element-plus';
import { ref } from 'vue';
const imageUrl = ref('')
const uploadChange: UploadProps['onChange'] = (file) => {
  console.log('file :>> ', file);
}

</script>

<style lang="scss" scoped>
.a {
  .bbb {
    @apply text-red-500;
  }
}
:deep(.el-upload) {
  --at-apply: "h-full text-center";
}
:deep(.el-upload-dragger) {
  --at-apply: "h-full text-center";
}
</style>