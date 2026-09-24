<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Question } from '../engine/questionGenerator'

const props = defineProps<{
  question: Question | null
  revealed: boolean
}>()
const emit = defineEmits<{ (e: 'answer', value: string): void }>()

const selected = ref<string | null>(null)
const input = ref('')

watch(
  () => props.question,
  () => {
    selected.value = null
    input.value = ''
  },
)

function choose(c: string): void {
  if (props.revealed) return
  selected.value = c
  emit('answer', c)
}

function submit(): void {
  if (props.revealed || !input.value.trim()) return
  emit('answer', input.value)
}

function choiceClass(c: string): string {
  if (!props.revealed) return selected.value === c ? 'is-selected' : ''
  if (c === props.question?.answer) return 'is-correct'
  if (c === selected.value) return 'is-wrong'
  return ''
}
</script>

<template>
  <div v-if="question" class="question">
    <p class="question__prompt">{{ question.prompt }}</p>

    <!-- 选择题 -->
    <div v-if="question.choices" class="question__choices">
      <button
        v-for="c in question.choices"
        :key="c"
        type="button"
        class="question__choice"
        :class="choiceClass(c)"
        :disabled="revealed"
        @click="choose(c)"
      >
        {{ c }}
      </button>
    </div>

    <!-- 拼写 / 填空 -->
    <form v-else class="question__input-row" @submit.prevent="submit">
      <input
        v-model="input"
        class="question__input"
        type="text"
        autocomplete="off"
        autocapitalize="off"
        autocorrect="off"
        spellcheck="false"
        placeholder="输入单词"
        :disabled="revealed"
        aria-label="拼写输入"
      />
      <button
        v-if="!revealed"
        class="question__submit"
        type="submit"
        :disabled="!input.trim()"
      >
        确认
      </button>
    </form>

    <!-- 揭示后：拼写题展示正确拼写 -->
    <div v-if="revealed && !question.choices" class="question__reveal">
      <span class="question__wrong-input" v-if="selected">{{ selected }}</span>
      <span class="question__correct">{{ question.answer }}</span>
    </div>
  </div>
</template>

<style scoped>
.question__prompt {
  margin: 0 0 var(--space-4);
  font-size: 1.125rem;
  line-height: 1.6;
  color: var(--color-text);
}
.question__choices {
  display: grid;
  gap: var(--space-2);
}
.question__choice {
  min-height: 52px;
  padding: 0 var(--space-4);
  text-align: left;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 1rem;
  transition: transform var(--dur-press) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), background var(--dur-fast) var(--ease-standard);
}
.question__choice:active {
  transform: scale(0.99);
}
.question__choice.is-selected {
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
}
.question__choice.is-correct {
  border-color: var(--color-success);
  background: color-mix(in srgb, var(--color-success) 14%, transparent);
  color: var(--color-success);
}
.question__choice.is-wrong {
  border-color: var(--color-danger);
  background: color-mix(in srgb, var(--color-danger) 14%, transparent);
  color: var(--color-danger);
}
.question__input-row {
  display: flex;
  gap: var(--space-2);
}
.question__input {
  flex: 1;
  min-height: 52px;
  padding: 0 var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  font-size: 1.125rem;
}
.question__input:focus {
  border-color: var(--color-primary);
  outline: none;
}
.question__submit {
  min-height: 52px;
  padding: 0 var(--space-6);
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: #fff;
  font-weight: 600;
}
.question__submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.question__reveal {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  margin-top: var(--space-3);
  font-size: 1.125rem;
}
.question__wrong-input {
  color: var(--color-danger);
  text-decoration: line-through;
}
.question__correct {
  color: var(--color-success);
  font-weight: 700;
}
</style>