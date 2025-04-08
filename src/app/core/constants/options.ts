// src/app/core/constants/options.ts

export const relativeOptions = [
  { value: 'Padre', label: 'Padre' },
  { value: 'Madre', label: 'Madre' },
  { value: 'Abuelo', label: 'Abuelo/a' },
  { value: 'Abuela', label: 'Tío/a' },
  { value: 'Sibling', label: 'Hermano/a' },
  { value: 'Cousin', label: 'Primo/a' },
  { value: 'Child', label: 'Hijo/a' },
  { value: 'Nibling', label: 'Sobrino/a' },
];

export const historyTypeOptions = [
  { value: 'patológico', label: 'Patológico' },
  { value: 'Non-Pathological', label: 'No Patológico' },
  { value: 'quirúrgico', label: 'Quirúrgico' },
  { value: 'Hereditary', label: 'Hereditario' },
  { value: 'Congenital', label: 'Congénito' },
  { value: 'Chronic', label: 'Crónico' },
  { value: 'Allergic', label: 'Alérgico' },
  { value: 'otros', label: 'Otros' },

];

export const getLabel = (
  options: { value: string; label: string }[],
  value: string
): string => options.find((option) => option.value === value)?.label || value;
