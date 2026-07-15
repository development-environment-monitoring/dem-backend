import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('machine_aliases')
export class MachineAlias {
  @PrimaryColumn({ name: 'machine_id' })
  machineId: string;

  @Column({ type: 'varchar', length: 120 })
  alias: string;
}
