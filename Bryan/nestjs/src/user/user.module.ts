import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { DfaModule } from 'src/dfa/dfa.module';
import { PictureModule } from 'src/picture/picture.module';

@Module({
	imports: [TypeOrmModule.forFeature([User]), DfaModule, PictureModule],
	controllers: [UserController],
	providers: [UserService],
})
export class UserModule {}
