import { Entity, PrimaryGeneratedColumn, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../user/user.entity'

@Entity()
export class Friend
{
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => User, user => user.friends)
    user: User;

	@OneToOne(() => User)
    @JoinColumn()
    friend: User;
}
