"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; icon?: string }[];
  disabled?: boolean;
  container?: HTMLElement | null;
};

export default function FilterSelect({ label, value, onChange, options, disabled, container }: Props) {
  return <Select value={value} onValueChange={onChange} disabled={disabled}>
    <SelectTrigger className="arcade-select-trigger" aria-label={label}><SelectValue/></SelectTrigger>
    <SelectContent className="arcade-select-content" position="popper" align="start" container={container}>
      {options.map(option => <SelectItem className="arcade-select-item" key={option.value} value={option.value}>{option.icon && <span aria-hidden="true">{option.icon}</span>}{option.value}</SelectItem>)}
    </SelectContent>
  </Select>;
}
