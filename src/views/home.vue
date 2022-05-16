<template>
  <div>
    <el-upload
      class="w-32 h-32"
      :show-file-list="false"
      :drag="true"
      :auto-upload="false"
      :on-change="uploadChange"
    >
      <img
        v-if="imageUrl"
        :src="imageUrl"
        class="avatar"
      >
      <el-icon
        v-else
        class="avatar-uploader-icon"
      >
        <Plus />
      </el-icon>
    </el-upload>
    <canvas
      id="myCanvas"
      ref="myCanvas"
    />
    <div>
      click and remove to transform image
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UploadProps, UploadRawFile } from 'element-plus';
import { ref, watch } from 'vue';
import { ImgWarper } from '@/utils/ImageWrap.js';
const imageUrl = ref('')
const width = ref(0)
const height = ref(0)
const startPoint = ref<Array<number>>([]);
const endPoint = ref<Array<number>>([]);
let myCanvas = ref<HTMLCanvasElement>();
const uploadChange: UploadProps['onChange'] = (file) => {
  const reader = new FileReader();
  reader.readAsDataURL((file.raw as UploadRawFile))
  reader.addEventListener('load', () => {
    imageUrl.value = (reader.result as string);
  })
}
watch(
  () => imageUrl.value,
  () => {
    drawNewImage()
  }
)
const drawNewImage = () => {
  const image = document.createElement('img');
  image.src = imageUrl.value;
  image.onload= () => {
    const ctx = myCanvas.value?.getContext('2d');
    console.log('drawImage');
    width.value = image.naturalWidth;
    height.value = image.naturalHeight;
    (myCanvas.value as HTMLCanvasElement).width = width.value;
    (myCanvas.value as HTMLCanvasElement).height = height.value;
    ctx?.drawImage(image, 0,0, width.value, height.value);
    (myCanvas.value as HTMLCanvasElement).addEventListener('mousedown', mouseDown)
  }
  const mouseDown = (event: MouseEvent) => {
    startPoint.value = [event.offsetX, event.offsetY]
    myCanvas.value?.addEventListener('mouseup', (event) => {
      endPoint.value = [event.offsetX, event.offsetY];
      transoformImage();
    })
  }
}
const transoformImage = () => {
  let fromPoints = createBasePoint();
  let endPoints = createBasePoint();
  const ctx = myCanvas.value?.getContext('2d')
  const imageData = ctx?.getImageData(0, 0, width.value, height.value)
  fromPoints.push(new ImgWarper.Point(startPoint.value[0], startPoint.value[1]))
  endPoints.push(new ImgWarper.Point(endPoint.value[0], endPoint.value[1]));
  let warper = new ImgWarper.PointDefiner(
    myCanvas.value,
    imageData,
    fromPoints,
    endPoints
  );
  warper.imgWarper.warp(fromPoints, endPoints);
}
const createBasePoint = () => {
  let points = [];
  points.push(new ImgWarper.Point(0, 0));
  points.push(new ImgWarper.Point(width.value * (1 / 8), 0));
  points.push(new ImgWarper.Point(width.value * (2 / 8), 0));
  points.push(new ImgWarper.Point(width.value * (3 / 8), 0));
  points.push(new ImgWarper.Point(width.value * (4 / 8), 0));
  points.push(new ImgWarper.Point(width.value * (5 / 8), 0));
  points.push(new ImgWarper.Point(width.value * (6 / 8), 0));
  points.push(new ImgWarper.Point(width.value * (7 / 8), 0));
  points.push(new ImgWarper.Point(width.value, 0));
  points.push(new ImgWarper.Point(width.value, height.value * (1 / 8)));
  points.push(new ImgWarper.Point(width.value, height.value * (2 / 8)));
  points.push(new ImgWarper.Point(width.value, height.value * (3 / 8)));
  points.push(new ImgWarper.Point(width.value, height.value * (4 / 8)));
  points.push(new ImgWarper.Point(width.value, height.value * (5 / 8)));
  points.push(new ImgWarper.Point(width.value, height.value * (6 / 8)));
  points.push(new ImgWarper.Point(width.value, height.value * (7 / 8)));
  points.push(new ImgWarper.Point(width.value, height.value));
  points.push(new ImgWarper.Point(width.value * (7 / 8), height.value));
  points.push(new ImgWarper.Point(width.value * (6 / 8), height.value));
  points.push(new ImgWarper.Point(width.value * (5 / 8), height.value));
  points.push(new ImgWarper.Point(width.value * (4 / 8), height.value));
  points.push(new ImgWarper.Point(width.value * (3 / 8), height.value));
  points.push(new ImgWarper.Point(width.value * (2 / 8), height.value));
  points.push(new ImgWarper.Point(width.value * (1 / 8), height.value));
  points.push(new ImgWarper.Point(0, height.value));
  points.push(new ImgWarper.Point(0, height.value * (1 / 8)));
  points.push(new ImgWarper.Point(0, height.value * (2 / 8)));
  points.push(new ImgWarper.Point(0, height.value * (3 / 8)));
  points.push(new ImgWarper.Point(0, height.value * (4 / 8)));
  points.push(new ImgWarper.Point(0, height.value * (5 / 8)));
  points.push(new ImgWarper.Point(0, height.value * (6 / 8)));
  points.push(new ImgWarper.Point(0, height.value * (7 / 8)));
  points.push(new ImgWarper.Point(0, height.value));
  return points;
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