import { useState, type ReactNode } from "react";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { sfxHover, sfxTick } from "@/lib/game/audio";
import { cn } from "@/lib/utils";

export type MenuOption<T extends string> = {
  id: T;
  label: string;
  blurb?: string;
  art?: ReactNode;
};

type MenuSelectProps<T extends string> = {
  value?: T;
  items: MenuOption<T>[];
  onChange: (next: T) => void;
  placeholder?: string;
  ariaLabel: string;
  name?: string;
};

export function MenuSelect<T extends string>({
  value,
  items,
  onChange,
  placeholder = "Wählen",
  ariaLabel,
  name,
}: MenuSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const current = items.find((item) => item.id === value);

  return (
    <Select.Root
      value={value}
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        sfxTick();
      }}
      onValueChange={(next) => onChange(next as T)}
    >
      <Select.Trigger
        aria-label={ariaLabel}
        data-menu={name ?? ariaLabel}
        className={cn(
          "flex h-14 w-full items-center gap-3 rounded-md bg-raised px-3 text-left text-fg shadow-border outline-none",
          "transition-[background-color,transform,box-shadow] duration-150 ease-out",
          "hover:-translate-y-px hover:bg-surface",
          "focus-visible:ring-2 focus-visible:ring-primary/70",
          "data-[state=open]:bg-surface data-[state=open]:ring-2 data-[state=open]:ring-primary/70",
        )}
      >
        {current?.art ? <span className="shrink-0">{current.art}</span> : null}
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {current?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted transition-transform duration-150 ease-out",
            open && "rotate-180",
          )}
        />
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          position="popper"
          side="bottom"
          align="start"
          sideOffset={8}
          collisionPadding={12}
          className="menu-panel z-50 overflow-hidden rounded-lg bg-surface text-fg shadow-lift"
        >
          <Select.Viewport className="max-h-[min(20rem,70vh)] overflow-y-auto p-1.5">
            {items.map((item) => (
              <Select.Item
                key={item.id}
                value={item.id}
                onMouseEnter={() => {
                  if (item.id !== value) sfxHover();
                }}
                className={cn(
                  "group relative flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2.5 outline-none",
                  "transition-colors duration-150",
                  "data-[highlighted]:not-data-[state=checked]:bg-raised",
                  "data-[state=checked]:bg-primary data-[state=checked]:text-primary-fg",
                )}
              >
                {item.art ? <span className="shrink-0">{item.art}</span> : null}
                <span className="min-w-0 flex-1">
                  <Select.ItemText>
                    <span className="block truncate text-sm font-medium">{item.label}</span>
                  </Select.ItemText>
                  {item.blurb ? (
                    <span className="mt-0.5 block text-xs leading-snug text-muted group-data-[state=checked]:text-primary-fg/80">
                      {item.blurb}
                    </span>
                  ) : null}
                </span>
                <Select.ItemIndicator className="shrink-0">
                  <Check className="size-4" strokeWidth={2} />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
