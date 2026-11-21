export interface TocItem {
  id: string;
  unitId: string;
  title: string;
  page: number;
  endPage: number;
  type: 'intro' | 'unit' | 'experiment' | 'lesson' | 'enrichment' | 'review' | 'glossary';
}

export interface BookUnitMeta {
  id: string;
  number: number;
  title: string;
  englishTitle: string;
  startPage: number;
  endPage: number;
  items: TocItem[];
}

export const bookToc: BookUnitMeta[] = [
  {
    id: 'unit-1',
    number: 1,
    title: 'الوحدة الأولى: المتجهات',
    englishTitle: 'Vectors',
    startPage: 5,
    endPage: 32,
    items: [
      { id: 'u1-open', unitId: 'unit-1', title: 'افتتاحية الوحدة: أتأمل الصورة والفكرة العامة', page: 5, endPage: 6, type: 'unit' },
      { id: 'u1-exp0', unitId: 'unit-1', title: 'تجربة استهلالية: ناتج جمع قوتين عملياً', page: 7, endPage: 7, type: 'experiment' },
      { id: 'u1-l1', unitId: 'unit-1', title: 'الدرس الأول: الكميات القياسية والكميات المتجهة', page: 8, endPage: 15, type: 'lesson' },
      { id: 'u1-l1-rev', unitId: 'unit-1', title: 'مراجعة الدرس الأول', page: 16, endPage: 16, type: 'review' },
      { id: 'u1-l2', unitId: 'unit-1', title: 'الدرس الثاني: جمع المتجهات وطرحها', page: 17, endPage: 27, type: 'lesson' },
      { id: 'u1-l2-rev', unitId: 'unit-1', title: 'مراجعة الدرس الثاني', page: 28, endPage: 28, type: 'review' },
      { id: 'u1-enrich', unitId: 'unit-1', title: 'الإثراء والتوسع: الوعاء المغناطيسي', page: 29, endPage: 29, type: 'enrichment' },
      { id: 'u1-rev', unitId: 'unit-1', title: 'مراجعة الوحدة الأولى', page: 30, endPage: 32, type: 'review' },
    ],
  },
  {
    id: 'unit-2',
    number: 2,
    title: 'الوحدة الثانية: الحركة والقوى',
    englishTitle: 'Motion and Forces',
    startPage: 33,
    endPage: 86,
    items: [
      { id: 'u2-open', unitId: 'unit-2', title: 'افتتاحية الوحدة: أتأمل الصورة والفكرة العامة', page: 33, endPage: 34, type: 'unit' },
      { id: 'u2-exp0', unitId: 'unit-2', title: 'تجربة استهلالية: وصف الحركة باستخدام المدرج الهوائي', page: 35, endPage: 35, type: 'experiment' },
      { id: 'u2-l1', unitId: 'unit-2', title: 'الدرس الأول: الحركة في بعد واحد', page: 36, endPage: 55, type: 'lesson' },
      { id: 'u2-l1-rev', unitId: 'unit-2', title: 'مراجعة الدرس الأول', page: 56, endPage: 56, type: 'review' },
      { id: 'u2-l2', unitId: 'unit-2', title: 'الدرس الثاني: الحركة في بعدين', page: 57, endPage: 65, type: 'lesson' },
      { id: 'u2-l2-rev', unitId: 'unit-2', title: 'مراجعة الدرس الثاني', page: 66, endPage: 66, type: 'review' },
      { id: 'u2-l3', unitId: 'unit-2', title: 'الدرس الثالث: قوانين الحركة لنيوتن', page: 67, endPage: 80, type: 'lesson' },
      { id: 'u2-l3-rev', unitId: 'unit-2', title: 'مراجعة الدرس الثالث', page: 81, endPage: 81, type: 'review' },
      { id: 'u2-enrich', unitId: 'unit-2', title: 'الإثراء والتوسع: حزام الأمان والقصور الذاتي', page: 82, endPage: 82, type: 'enrichment' },
      { id: 'u2-rev', unitId: 'unit-2', title: 'مراجعة الوحدة الثانية', page: 83, endPage: 86, type: 'review' },
    ],
  },
];

export const specialPages = [
  { id: 'cover', title: 'غلاف الكتاب', page: 1 },
  { id: 'toc', title: 'قائمة المحتويات', page: 3 },
  { id: 'intro', title: 'المقدمة', page: 4 },
  { id: 'glossary', title: 'مسرد المصطلحات', page: 87 },
];
