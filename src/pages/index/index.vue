<!-- 使用 type="home" 属性设置首页，其他页面不需要设置，默认为page；推荐使用json5，更强大，且允许注释 -->
<route lang="json5" type="home">
{
  style: {
    // navigationStyle: 'custom',
    navigationBarTitleText: '首页',
  },
}
</route>
<script setup lang="ts">
import data from '@/static/data.json'
import { Food } from '@/types/apis'

const purineOptions = [
  { value: '全部', label: '全部' },
  ...Object.keys(data.purineLevels).map((k) => ({ value: k, label: data.purineLevels[k].title })),
]

const categoryOptions = [
  { value: '全部', label: '全部' },
  ...data.categories.map((k) => ({ value: k, label: k })),
]

const selectedLevel = ref('全部')
const selectedCategory = ref('全部')
const keyWord = ref('')
const foods = ref<Food[]>([])
const filteredFoods = ref<Food[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const selectedFoodDetail = ref<Food | null>(null)

const getLevelLabel = (level: string) => {
  const option = purineOptions.find((opt) => opt.value === level)
  return option?.label || level
}

const getCategoryLabel = (category: string) => {
  const option = categoryOptions.find((opt) => opt.value === category)
  return option?.label || category
}

const selectFood = (food: Food) => {
  selectedFoodDetail.value = food
}

const closeModal = () => {
  selectedFoodDetail.value = null
}

const loadFoods = async () => {
  try {
    loading.value = true
    error.value = null
    filteredFoods.value = foods.value.filter((food) => {
      const levelMatch = selectedLevel.value === '全部' || food.level === selectedLevel.value
      const categoryMatch =
        selectedCategory.value === '全部' || food.category === selectedCategory.value
      const keyWordMatch =
        !keyWord.value ||
        (keyWord.value && (food.name.includes(keyWord.value) || keyWord.value.includes(food.name)))
      console.log('🚀 ~ loadFoods ~ keyWordMatch:', levelMatch, categoryMatch, keyWordMatch)
      return levelMatch && categoryMatch && keyWordMatch
    })
  } catch (err: any) {
    error.value = err.message || '加载失败'
    console.error('Error loading foods:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  foods.value = data.foods
  loadFoods()
})
</script>

<template>
  <view class="page-container">
    <view class="filter-section mb-4">
      <wd-search v-model="keyWord" placeholder-left hide-cancel @search="loadFoods" />
      <view class="filter-options">
        <wd-drop-menu>
          <wd-drop-menu-item v-model="selectedLevel" :options="purineOptions" @change="loadFoods" />
          <wd-drop-menu-item
            v-model="selectedCategory"
            :options="categoryOptions"
            @change="loadFoods"
          />
        </wd-drop-menu>
      </view>
    </view>
    <view class="container">
      <view v-if="loading" class="loading-section">
        <view class="loading-spinner"></view>
        <view>加载中...</view>
      </view>

      <view v-else-if="error" class="error-section">
        <view class="error-message">{{ error }}</view>
      </view>

      <view v-else-if="filteredFoods.length === 0" class="empty-section">
        <wd-status-tip image="content" tip="暂无数据" />
      </view>

      <view v-else class="foods-grid">
        <view
          v-for="food in filteredFoods"
          :key="food.id"
          class="food-card card"
          @click="selectFood(food)"
        >
          <view class="food-header">
            <view class="food-name">{{ food.name }}</view>
            <text class="badge" :class="`badge-${food.level}`">
              {{ getLevelLabel(food.level) }}
            </text>
          </view>
          <view class="food-category">{{ getCategoryLabel(food.category) }}</view>
          <view class="food-purine">
            <text class="purine-value" :class="`value-${food.level}`">{{ food.purine }}</text>
            <text class="purine-unit">mg/100g</text>
          </view>
          <view class="food-description">{{ food.description }}</view>
        </view>
      </view>
    </view>

    <view v-if="selectedFoodDetail" class="modal" @click="closeModal">
      <view class="modal-content card" @click.stop>
        <wd-button class="modal-close" type="icon" icon="close" @click="closeModal"></wd-button>
        <view class="modal-title">{{ selectedFoodDetail.name }}</view>
        <text class="badge" :class="`badge-${selectedFoodDetail.level}`">
          {{ getLevelLabel(selectedFoodDetail.level) }}
        </text>
        <view class="modal-detail">
          <view class="detail-row">
            <text class="detail-label">类别</text>
            <text class="detail-value">{{ getCategoryLabel(selectedFoodDetail.category) }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">嘌呤含量</text>
            <text class="detail-value">{{ selectedFoodDetail.purine }} mg/100g</text>
          </view>
        </view>
        <view class="modal-description">{{ selectedFoodDetail.description }}</view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.loading-section,
.empty-section {
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

.foods-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.food-card {
  cursor: pointer;
  transition: all 0.2s;
}

.food-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.food-name {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.food-category {
  margin-bottom: 8px;
  font-size: 14px;
  color: #6b7280;
}

.food-purine {
  margin: 16px 0;
}

.purine-value {
  font-size: 28px;
  font-weight: 700;
}

.purine-unit {
  margin-left: 4px;
  font-size: 14px;
  color: #6b7280;
}

.food-description {
  font-size: 14px;
  line-height: 1.5;
  color: #6b7280;
}

.modal {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: relative;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 32px;
  cursor: pointer;
}

.modal-title {
  padding-right: 32px;
  margin-bottom: 16px;
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
}

.modal-detail {
  margin: 24px 0;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #c8c7cc;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  color: #6b7280;
}

.detail-value {
  font-weight: 600;
  color: #1f2937;
}

.modal-description {
  line-height: 1.6;
  color: #6b7280;
}
</style>
