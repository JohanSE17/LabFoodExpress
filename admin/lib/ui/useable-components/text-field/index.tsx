// Interface
import { ITextComponentProps } from '@/lib/utils/interfaces';

export default function TextComponent({
  text,
  className,
}: any) {
  return <div className={`custom-text ${className}`}>{text}</div>;
}
