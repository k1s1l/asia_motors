import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

export function EmptyState({ icon = "box", title, text, children }: { icon?: IconName; title: string; text?: ReactNode; children?: ReactNode }) {
  return (
    <div className="empty panel">
      <span className="empty__icon"><Icon name={icon} size={30} /></span>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      {children && <div className="empty__actions">{children}</div>}
    </div>
  );
}
