import { ITextComponentProps } from '@/lib/utils/interfaces';

export default function HeaderText({ text, className }: any) {
  return <div className={`heading-2 font-bold ${className}`}>{text}</div>;
}
