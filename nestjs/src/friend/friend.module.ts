import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friend } from './friend.entity';
import { FriendController } from './friend.controller';
import { FriendService } from './friend.service';
import { UserModule } from 'src/user/user.module';

@Module({
	imports: [TypeOrmModule.forFeature([Friend]), UserModule],
	controllers: [FriendController],
	providers: [FriendService]
})
export class FriendModule {}
