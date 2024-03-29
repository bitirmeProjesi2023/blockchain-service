import { Controller, Get, Post, Body, Param, HttpCode, UseGuards, Req, Put } from '@nestjs/common';
import { NftService } from './nft.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { LazyMintNftDto } from './dto/lazy-mint-nft.dto';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from "@nestjs/swagger";
import { GetUserNftsResponseDto } from './dto/get-user-nfts.response.dto';
import { BuyNftDto } from './dto/buy-nft.dto';
import axios from 'axios';
import { GetOneNftByIdDto } from './dto/get-one-nft-by-id.dto';
import { AuthHomePageGuard } from 'src/auth/auth.home-page.guard';

@ApiTags('nfts')
@Controller('nfts')
export class NftController {
  constructor(private readonly nftService: NftService) { }


  @Get('get-price/:tokenId')
  @HttpCode(200)
  async getPrice(@Param('tokenId') tokenId: string): Promise<{ price: number, tokenId: string }> {
    const price = await this.nftService.getPrice(tokenId);
    return { price, tokenId };
  }

  @ApiOperation({ summary: "buy an nft" })
  @ApiResponse({
    status: 200,
  })
  @UseGuards(AuthGuard)
  @HttpCode(200)
  @Post('buy/:nftId')
  async buy(@Param('nftId') nftId: string, @Body() buyNftDto: BuyNftDto) {
    await this.nftService.buy(nftId, buyNftDto.buyerId);
  }

  @ApiOperation({ summary: "get all nfts on sale on marketplace" })
  @ApiResponse({
    status: 200,
    description: 'all nfts fetched'
  })
  @Get('get-all-nfts')
  async getAllNftsOnSale() {
    const nfts = await this.nftService.getAllNftsOnSale();
    return nfts.map((nft) => {
      return {
        nftPrice: nft.price,
        nftName: nft.ipfsEntity.nft_name,
        nftImageUrl: this.nftService.getNftViewUrl(nft.ipfsEntity.cid),
        nftId: nft.nft_id
      }
    })
  }

  @Get('get-user-lazy-minted-nfts')
  @UseGuards(AuthGuard)
  async getUserLazyMintedNfts(@Req() request: Request) {
    const userId: string = request['user'].user_id;
    const result = await this.nftService.getUserLazyMintedNfts(userId);
    return result;
  }

  @ApiOperation({ summary: "get a user's all nfts" })
  @ApiResponse({
    status: 200,
    description: "user's all nfts fetched",
    type: Array<GetUserNftsResponseDto>
  })
  @Get('get-user-nfts')
  @UseGuards(AuthGuard)
  async getNftsOwned(@Req() request: Request) {
    const ownerId: string = request['user'].user_id;
    const nfts = await this.nftService.getAllNftsOwnedBy(ownerId);

    return nfts.map((nft) => {
      return {
        nftPrice: nft.price,
        nftName: nft.ipfsEntity.nft_name,
        nftImageUrl: this.nftService.getNftViewUrl(nft.ipfsEntity.cid),
        nftId: nft.nft_id
      }
    })
  }

  @ApiOperation({ summary: 'lazy mint an nft' })
  @ApiResponse({
    status: 201,
  })
  @Post('lazy-mint')
  @HttpCode(201)
  async lazyMintNft(@Body() LazyMintNftDto: LazyMintNftDto) {
    await this.nftService.lazyMintNft(LazyMintNftDto);
  }

  @Get(':nftId')
  @ApiOperation({ summary: "get a nft by id" })
  @ApiResponse({
    status: 200,
  })
  @HttpCode(200)
  async getOneNftById(@Param() params: any, getOneNftByIdDto: GetOneNftByIdDto) {
    const nft = await this.nftService.findOneById(params.nftId);
    let response;
    try {
      response = await axios.get('http://127.0.0.1:3000/users/username', { data: { user_id: nft.owner_id } });
    }
    catch (err) {
      console.error(err);
    }
    const username = response.data['username'];
    return {
      nftPrice: nft.price,
      nftOwner: username,
      nftName: nft.ipfsEntity.nft_name,
      nftUrl: this.nftService.getNftViewUrl(nft.ipfsEntity.cid),
      isNftOnSale: nft.isOnSale,
      isMinted: nft.isMinted,
    }

  }

  getNftViewUrl(cid: string) {
    return `http://127.0.0.1:8080/ipfs/${cid}`;
  }

  @Put(':nftId/set-price/:newPrice')
  @HttpCode(200)
  async putNftOnSale(@Param() params: any) {
    const nft = await this.nftService.findOneById(params.nftId);
    const newPrice = await this.nftService.setPrice(nft, params.newPrice);
    return { price: newPrice, isOnSale: true };
  }

  @Put(':nftId/put-on-sale')
  @HttpCode(200)
  async setPrice(@Param() params: any) {
    const nft = await this.nftService.findOneById(params.nftId);
    await this.nftService.putOnSale(nft);
  }
}



