<route lang="json5" type="page">
{
  style: { navigationBarTitleText: '我的' },
}
</route>
<script lang="ts" setup>
import { useToast, useMessage } from 'wot-design-uni'
import { UricAcidRecord } from '@/types/apis'
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import dayjs from 'dayjs'

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
)

const message = useMessage()
const toast = useToast()

const chartCanvas = ref<HTMLCanvasElement | null>(null)
const chartInstance = ref<Chart | null>(null)
const statsTips = [
  {
    label: '平均值',
    key: 'average',
  },
  {
    label: '最低值',
    key: 'min',
  },
  {
    label: '最高值',
    key: 'max',
  },
]
const locaRecords = ref<UricAcidRecord[]>([])
const records = ref<UricAcidRecord[]>([])
const loading = ref(true)
const showAddModal = ref(false)
const saving = ref(false)
const defaultValue = ref<number>(Date.now())

const initFormData = () => ({
  date: defaultValue.value,
  uric_acid: '',
  note: '',
  id: undefined,
})
const formData = ref(initFormData())

const userId = ref('demo-user-id')

const stats = computed(() => {
  if (records.value.length === 0) {
    return { average: '-', min: '-', max: '-' }
  }

  const recentRecords = records.value.slice(0, 3)
  const values = recentRecords.map((r) => r.uric_acid)

  const sum = values.reduce((a, b) => a + b, 0)
  const avg = Math.round(sum / values.length)
  const min = Math.min(...values)
  const max = Math.max(...values)

  return { average: avg, min, max }
})

function handleConfirm({ value }) {
  console.log('🚀 ~ handleConfirm ~ value:', value, formData)
  console.log(new Date(value))
}

const loadRecords = () => {
  try {
    loading.value = true

    locaRecords.value = uni.getStorageSync<UricAcidRecord[]>('UricAcidRecord') || []
    console.log('🚀 ~ loadRecords ~ locaRecords.value:', locaRecords.value)
    const data = locaRecords.value.filter((c) => c.user_id === userId.value)

    records.value = data || []
    updateChart()
  } catch (err) {
    console.error('Error loading records:', err)
  } finally {
    loading.value = false
  }
}

const updateChart = () => {
  if (!chartCanvas.value || records.value.length === 0) return

  const sortedRecords = [...records.value].reverse()
  const labels = sortedRecords.map((r) => dayjs(r.date).format('YYYY-MM-DD'))
  const data = sortedRecords.map((r) => r.uric_acid)

  if (chartInstance.value) {
    chartInstance.value.destroy()
  }

  // chartInstance.value = new Chart(chartCanvas.value, {
  //   type: 'line',
  //   data: {
  //     labels,
  //     datasets: [
  //       {
  //         label: '尿酸值 (μmol/L)',
  //         data,
  //         borderColor: '#10b981',
  //         backgroundColor: 'rgba(16, 185, 129, 0.1)',
  //         tension: 0.4,
  //         fill: true,
  //       },
  //     ],
  //   },
  //   options: {
  //     responsive: true,
  //     maintainAspectRatio: true,
  //     plugins: {
  //       legend: {
  //         display: false,
  //       },
  //     },
  //     scales: {
  //       y: {
  //         beginAtZero: false,
  //       },
  //     },
  //   },
  // })
}

const deleteRecord = async (id: string) => {
  message
    .confirm({
      title: '系统提示',
      msg: '确定要删除这条记录吗？',
    })
    .then(() => {
      console.log('点击了确定按钮')
      const index = locaRecords.value.findIndex((c) => c.id === id)
      locaRecords.value.splice(index, 1)
      uni.setStorageSync('UricAcidRecord', locaRecords.value)

      loadRecords()
    })
    .catch(() => {
      console.log('点击了取消按钮')
    })
}

const saveRecord = async () => {
  try {
    saving.value = true

    const recordData = {
      user_id: userId.value,
      date: formData.value.date,
      uric_acid: Number(formData.value.uric_acid),
      note: formData.value.note,
    }

    if (formData.value.id !== undefined) {
      const index = locaRecords.value.findIndex((c) => c.id === formData.value.id)
      locaRecords.value.splice(index, 1, { ...locaRecords[index], ...recordData })
      uni.setStorageSync('UricAcidRecord', locaRecords.value)
    } else {
      uni.setStorageSync('UricAcidRecord', [
        ...locaRecords.value,
        { ...recordData, id: locaRecords.value.length },
      ])
    }

    loadRecords()
    closeModal()
    toast.show('保存成功')
  } catch (err) {
    console.error('Error saving record:', err)
    toast.show('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

const openModal = (record: UricAcidRecord | null) => {
  if (record) {
    formData.value = {
      date: record.date as number,
      uric_acid: record.uric_acid.toString(),
      note: record.note,
      id: record.id,
    }
  } else {
    formData.value = initFormData()
  }
  showAddModal.value = true
}
const closeModal = () => {
  showAddModal.value = false
}

onMounted(() => {
  loadRecords()
})

onUnmounted(() => {
  if (chartInstance.value) {
    chartInstance.value.destroy()
  }
})
</script>

<template>
  <div class="page-container">
    <div class="container">
      <view class="section-title mb-4">尿酸水平</view>
      <div class="stats-section">
        <div class="stat-card card" v-for="item in statsTips" :key="item.key">
          <div class="stat-label">{{ item.label }}</div>
          <div class="stat-value">{{ stats[item.key] }}</div>
          <div class="stat-unit">μmol/L</div>
        </div>
      </div>

      <view class="section-title mb-4">尿酸趋势</view>
      <div class="mb-4 card">
        <canvas ref="chartCanvas"></canvas>
        <p v-if="records.length === 0" class="empty-message">暂无数据，请添加记录</p>
      </div>

      <div class="flex items-center justify-between mb-4">
        <view class="section-title">历史记录</view>
        <wd-button size="small" class="mx-0" @click="openModal(null)">添加记录</wd-button>
      </div>
      <div class="records-section">
        <div v-if="loading" class="loading-section">
          <div class="loading-spinner"></div>
        </div>
        <div v-else-if="records.length === 0" class="empty-section card">
          <p>暂无记录</p>
        </div>
        <div v-else class="records-list">
          <div v-for="record in records" :key="record.id" class="record-item card">
            <div class="record-header">
              <div class="record-date">{{ dayjs(record.date).format('YYYY-MM-DD') }}</div>
              <div class="record-actions">
                <wd-button size="small" icon="edit" @click="openModal(record)" />
                <wd-button
                  size="small"
                  type="error"
                  icon="delete"
                  @click="deleteRecord(record.id)"
                />
              </div>
            </div>
            <div class="record-value">{{ record.uric_acid }} μmol/L</div>
            <div v-if="record.note" class="record-note">{{ record.note }}</div>
          </div>
        </div>
      </div>
    </div>

    <wd-popup
      v-model="showAddModal"
      position="bottom"
      custom-style="height: 368px;border-radius:32rpx 32rpx 0 0;"
      :safe-area-inset-bottom="true"
      @close="closeModal"
    >
      <div class="modal-content" @click.stop>
        <view class="flex items-center justify-between">
          <view class="modal-title">{{ formData.id ? '编辑记录' : '添加记录' }}</view>
          <wd-button size="small" class="mx-0" :disabled="saving" @click="saveRecord">
            {{ saving ? '保存中...' : '保存' }}
          </wd-button>
        </view>

        <wd-form ref="form2" :model="formData">
          <wd-cell-group border>
            <wd-calendar
              v-model="formData.date"
              :default-value="defaultValue"
              label="日期选择"
              label-width="100px"
              prop="date"
              clearable
              align-right
              root-portal
              :show-confirm="false"
              @confirm="handleConfirm"
            />
            <wd-input
              label="尿酸值 (μmol/L)"
              label-width="100px"
              prop="uric_acid"
              clearable
              v-model="formData.uric_acid"
              placeholder="请输入尿酸值"
              :rules="[{ required: false, pattern: /\d{6}/, message: '请输入尿酸值' }]"
            />
            <wd-textarea
              label="备注（可选）"
              label-width="100px"
              prop="note"
              clearable
              v-model="formData.note"
              placeholder="例如：早晨空腹检测"
            />
          </wd-cell-group>
        </wd-form>
      </div>
    </wd-popup>
  </div>
</template>

<style lang="scss" scoped>
.stats-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;

  .stat-card {
    padding: 16px;
    text-align: center;

    .stat-label {
      margin-bottom: 4px;
      font-size: 14px;
      color: #6b7280;
    }

    .stat-value {
      margin: 4px 0;
      font-size: 28px;
      font-weight: 700;
      color: #4cd964;
    }

    .stat-unit {
      font-size: 12px;
      color: #6b7280;
    }
  }
}

.empty-message {
  padding: 32px 0;
  color: #6b7280;
  text-align: center;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.records-section {
  padding-bottom: 24px;

  .loading-section {
    padding: 32px 0;
    text-align: center;

    .loading-spinner {
      width: 48px;
      height: 48px;
      margin: 0 auto;
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
  }

  .empty-section {
    padding: 32px;
    color: #6b7280;
    text-align: center;
  }

  .records-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .record-item {
    transition: all 0.2s;
  }

  .record-item:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .record-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .record-date {
    font-size: 14px;
    color: #6b7280;
  }

  .record-actions {
    display: flex;
    gap: 8px;

    :deep() .wd-button__icon {
      margin-right: 0;
    }
  }

  .record-value {
    margin-bottom: 4px;
    font-size: 24px;
    font-weight: 700;
    color: #4cd964;
  }

  .record-note {
    font-size: 14px;
    line-height: 1.5;
    color: #6b7280;
  }
}

.modal-content {
  width: 100%;
  padding: 0 16px;

  .modal-title {
    margin: 12px 0;
    font-size: 20px;
    font-weight: 700;
    color: #1f2937;
  }
}
</style>
