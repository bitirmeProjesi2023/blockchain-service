import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
    name: 'user_nfts',
    database: 'db',
})
export class MintedNftEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    user_id: number;

    @Column()
    token_id: number;

    @Column()
    name: string;

    @Column()
    price: number;

    @Column()
    created_at: Date;
}