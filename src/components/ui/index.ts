export { Card } from './Card';
export { Badge } from './Badge';
export { StreamingText } from './StreamingText';
export { Modal } from './Modal';
export { Table } from './Table';

// Also provide default-like exports for files that import as default
import { Card as CardComponent } from './Card';
import { Badge as BadgeComponent } from './Badge';
import { StreamingText as StreamingTextComponent } from './StreamingText';
import { Modal as ModalComponent } from './Modal';
import { Table as TableComponent } from './Table';

export default {
  Card: CardComponent,
  Badge: BadgeComponent,
  StreamingText: StreamingTextComponent,
  Modal: ModalComponent,
  Table: TableComponent,
};
