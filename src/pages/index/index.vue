<!-- 使用 type="home" 属性设置首页，其他页面不需要设置，默认为page；推荐使用json5，更强大，且允许注释 -->
<route lang="json5" type="home">
{
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '首页',
  },
}
</route>
<template>
  <!-- :style="{ marginTop: safeAreaInsets?.top + height + 'px' }" -->
  <view class="bg-#f5f5f5 overflow-hidden">
    <div class="page-container">
      <div class="container">
        <h1 class="page-title">食物嘌呤识别</h1>

        <div class="upload-section card">
          <div v-if="!imagePreview" class="upload-area">
            <wd-upload
              ref="fileInput"
              accept="image"
              :file-list="fileList"
              action="https://mockapi.eolink.com/zhTuw2P8c29bc981a741931bdd86eb04dc1e8fd64865cb5/upload"
              @change="handleChange"
            >
              <wd-button>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="2"
                    ry="2"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                  <polyline
                    points="21 15 16 10 5 21"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                上传图片
              </wd-button>
            </wd-upload>
          </div>

          <div v-else class="preview-area">
            <img :src="imagePreview" alt="Preview" class="preview-image" />
            <wd-button @click="clearImage" class="btn btn-secondary btn-full">重新选择</wd-button>
            <wd-button @click="analyzeImage" class="btn btn-primary btn-full" :disabled="analyzing">
              {{ analyzing ? '识别中...' : '开始识别' }}
            </wd-button>
          </div>
        </div>

        <div v-if="analyzing" class="loading-section">
          <div class="loading-spinner"></div>
          <p>AI正在识别食物...</p>
        </div>

        <div v-if="error" class="error-section card">
          <p class="error-message">{{ error }}</p>
        </div>

        <div v-if="result" class="result-section">
          <div class="card result-card">
            <h2 class="result-title">识别结果</h2>
            <div class="result-food">
              <h3>{{ result.foodName }}</h3>
              <span class="badge" :class="`badge-${result.level}`">
                {{
                  result.level === 'high'
                    ? '高嘌呤'
                    : result.level === 'medium'
                      ? '中嘌呤'
                      : '低嘌呤'
                }}
              </span>
            </div>

            <div class="result-detail">
              <div class="detail-item">
                <span class="detail-label">嘌呤含量</span>
                <span class="detail-value">{{ result.purine }} mg/100g</span>
              </div>
            </div>

            <div class="result-advice">
              <h4>饮食建议</h4>
              <p>{{ result.advice }}</p>
            </div>

            <div
              v-if="result.alternatives && result.alternatives.length > 0"
              class="result-alternatives"
            >
              <h4>替代食物推荐</h4>
              <div class="alternatives-list">
                <span v-for="alt in result.alternatives" :key="alt" class="alternative-tag">
                  {{ alt }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </view>
</template>

<script lang="ts" setup>
import { TestEnum } from '@/typings'

defineOptions({
  name: 'Home',
})

// 获取屏幕边界到安全区域距离
// const { safeAreaInsets } = uni.getSystemInfoSync()
// 获取胶囊按钮
// const { height, top } = uni.getMenuButtonBoundingClientRect()

const fileInput = ref<HTMLInputElement | null>(null)
const imagePreview = ref<string | null>(null)
const analyzing = ref(false)
const error = ref<string | null>(null)
const result = ref<any>(null)

const fileList = ref<any[]>([
  {
    url: 'https://img12.360buyimg.com//n0/jfs/t1/29118/6/4823/55969/5c35c16bE7c262192/c9fdecec4b419355.jpg',
  },
])

function handleChange({ fileList }) {
  fileList.value = fileList
}

const clearImage = () => {
  imagePreview.value = null
  result.value = null
  error.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const analyzeImage = async () => {
  if (!imagePreview.value) return

  analyzing.value = true
  error.value = null
  result.value = null

  try {
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const mockResults = [
      {
        foodName: '牛肉',
        purine: 83,
        level: 'medium',
        advice: '中等嘌呤食物，痛风患者可适量食用，建议每次不超过50克，且避免在急性发作期食用。',
        alternatives: ['鸡胸肉', '豆腐', '鸡蛋'],
      },
      {
        foodName: '西兰花',
        purine: 70,
        level: 'medium',
        advice: '中等嘌呤食物，富含维生素C和膳食纤维，对痛风患者有益，可以适量食用。',
        alternatives: [],
      },
      {
        foodName: '苹果',
        purine: 14,
        level: 'low',
        advice: '低嘌呤食物，富含维生素和膳食纤维，痛风患者可以放心食用。',
        alternatives: [],
      },
    ]

    result.value = mockResults[Math.floor(Math.random() * mockResults.length)]
  } catch (err) {
    error.value = '识别失败，请重试'
  } finally {
    analyzing.value = false
  }
}

// 测试 uni API 自动引入
onLoad(() => {
  console.log(TestEnum.A)
})
</script>

<style lang="scss" scoped>
.page-title {
  margin: 24px 0;
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
}

.upload-section {
  margin-bottom: 24px;
}

.upload-area,
.preview-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.btn-full {
  width: 100%;
}

.preview-image {
  width: 100%;
  max-height: 400px;
  object-fit: cover;
  border-radius: 12px;
}

.loading-section {
  padding: 32px 0;
  text-align: center;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  margin: 0 auto 16px;
  border: 4px solid #c8c7cc;
  border-top-color: #4cd964;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-section {
  background-color: #fee2e2;
  border: 1px solid #fecaca;
}

.error-message {
  font-weight: 500;
  color: #dc2626;
}

.result-card {
  margin-bottom: 24px;
}

.result-title {
  margin-bottom: 16px;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.result-food {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid #c8c7cc;
}

.result-food h3 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.result-detail {
  margin-bottom: 24px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 16px 0;
}

.detail-label {
  color: #6b7280;
}

.detail-value {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.result-advice,
.result-alternatives {
  margin-top: 24px;
}

.result-advice h4,
.result-alternatives h4 {
  margin-bottom: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.result-advice p {
  line-height: 1.6;
  color: #6b7280;
}

.alternatives-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.alternative-tag {
  padding: 6px 12px;
  font-size: 14px;
  color: #1f2937;
  background-color: #f9fafb;
  border: 1px solid #c8c7cc;
  border-radius: 20px;
}
</style>
