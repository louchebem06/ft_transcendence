import { AlcoholService } from 'src/alcohol/alcohol.service';
import { UserAchievementService } from 'src/user-achievement/user-achievement.service';
import { Connection, EntitySubscriberInterface, EventSubscriber, UpdateEvent } from 'typeorm';
import { User } from './user.entity';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
	constructor(connection: Connection,
				private readonly alcoholService: AlcoholService,
				private readonly userAchievementService: UserAchievementService) {
		connection.subscribers.push(this);
	}

	listenTo() {
		return User;
	}

	async beforeUpdate(event: UpdateEvent<User>): Promise<void> {
		const id_user: number = event.entity.id;
		const nickname: string = event.entity.nickname;
		if (nickname === undefined || nickname == null)
			return ;
		else
			this.userAchievementService.insert(id_user, "YourName.");
		const creators: string[] = ["mberger-", "mmehran", "bledda"];
		if (await this.alcoholService.isAlcohol(nickname))
			this.userAchievementService.insert(id_user, "Alcoholic");
		else if (creators.includes(nickname.toLowerCase()))
			this.userAchievementService.insert(id_user, "Usurper");
	}
}