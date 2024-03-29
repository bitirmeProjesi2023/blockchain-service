import { Module, forwardRef } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IpfsModule } from './ipfs/ipfs.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NftModule } from './nft/nft.module';
import { AuthModule } from './auth/auth.module';
import { EthereumController } from './ethereum/ethereum.controller';
import { EthereumService } from './ethereum/ethereum.service';
import { EthereumModule } from './ethereum/ethereum.module';
import * as dotenv from 'dotenv';
import { NftEntity } from './nft/entities/nft.entity';
import { EthereumAccountEntity } from './ethereum/entities/ethereum-account.entity';
import { IpfsEntity } from './ipfs/entities/ipfs.entity';
dotenv.config();

@Module({
  imports: [IpfsModule, TypeOrmModule.forRoot({
    type: process.env.DB_TYPE as any,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT as any,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [NftEntity, EthereumAccountEntity, IpfsEntity],
    autoLoadEntities: true,
  }), NftModule, AuthModule, EthereumModule],
  controllers: [AppController],
  providers: [
    AppService,
    ],
})
export class AppModule {}
