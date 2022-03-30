import { Entity, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from './User'

@Entity()
export class Notification
{
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => User, user => user.notifications)
    receiver: User;

	@Column()
	msg: boolean

	@OneToOne(() => User)
    @JoinColumn()
    receiver?: User;

	@Column({ default: false })
	seen?: boolean
}