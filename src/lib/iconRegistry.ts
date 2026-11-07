/**
 * Icon Registry (WP-2.5) — المصدر المركزي الوحيد للأيقونات التشغيلية.
 *
 * - المكتبة: lucide-react 0.546.0 المثبتة فعلًا — كل الأسماء أدناه مُتحقَّق منها
 *   بالنواتج (node -e require('lucide-react')): لا أسماء مفترضة، لا dependency جديدة.
 * - القواعد المعمول بها:
 *   · strokeWidth موحد 1.8 للمكونات التشغيلية (يفرضه <Icon/> أدناه).
 *   · أحجام قياسية مقفلة: 16 / 18 / 20 / 24 / 32.
 *   · currentColor دائمًا (لا ألوان ثابتة داخل الأيقونة).
 *   · decorative: aria-hidden افتراضيًا؛ أيقونة تنفذ وظيفة تكون داخل زر/رابط
 *     له accessible name من نصه.
 *   · أسهم التنقل فقط تُعكس في RTL (انظر flipRtl أدناه) — لا عكس للبحث/الملف/الحقيبة.
 */
import {
  Search,
  SlidersHorizontal,
  X,
  UserRound,
  Briefcase,
  BriefcaseBusiness,
  Building2,
  MapPin,
  Clock,
  Banknote,
  Package,
  RefreshCw,
  Paperclip,
  FileText,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ClipboardList,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Bell,
  BellRing,
  Copy,
  Loader2,
  Palette,
  Code2,
  Video,
  Menu,
  Sparkles,
  Check,
  type LucideIcon,
} from 'lucide-react';

/** الأيقونات الاتجاهية الوحيدة المسموح عكسها في RTL (أسهم تنقل) */
const RTL_FLIPPABLE = new Set<string>(['ArrowRight', 'ArrowLeft']);

export interface IconDefinition {
  component: LucideIcon;
  /** true = سهم تنقل يُعكس آليًا في RTL (transform) — لا يمس الأيقونات غير الاتجاهية */
  flipRtl?: boolean;
}

export const iconRegistry = {
  Search: { component: Search },
  SlidersHorizontal: { component: SlidersHorizontal },
  X: { component: X },
  UserRound: { component: UserRound },
  Briefcase: { component: Briefcase },
  BriefcaseBusiness: { component: BriefcaseBusiness },
  Building2: { component: Building2 },
  MapPin: { component: MapPin },
  Clock: { component: Clock },
  Banknote: { component: Banknote },
  Package: { component: Package },
  RefreshCw: { component: RefreshCw },
  Paperclip: { component: Paperclip },
  FileText: { component: FileText },
  Send: { component: Send },
  CheckCircle2: { component: CheckCircle2 },
  AlertCircle: { component: AlertCircle },
  HelpCircle: { component: HelpCircle },
  ClipboardList: { component: ClipboardList },
  ChevronDown: { component: ChevronDown },
  ArrowRight: { component: ArrowRight, flipRtl: true },
  ArrowLeft: { component: ArrowLeft, flipRtl: true },
  ShieldCheck: { component: ShieldCheck },
  Bell: { component: Bell },
  BellRing: { component: BellRing },
  Copy: { component: Copy },
  Loader2: { component: Loader2 },
  Palette: { component: Palette },
  Code2: { component: Code2 },
  Video: { component: Video },
  Menu: { component: Menu },
  Sparkles: { component: Sparkles },
  Check: { component: Check },
} as const satisfies Record<string, IconDefinition>;

export type IconName = keyof typeof iconRegistry;

export const ICON_SIZES = [16, 18, 20, 24, 32] as const;
export type IconSize = (typeof ICON_SIZES)[number];

/** هل تُعكس هذه الأيقونة في RTL؟ */
export function isRtlFlippable(name: IconName): boolean {
  return RTL_FLIPPABLE.has(name);
}

export { type LucideIcon };
