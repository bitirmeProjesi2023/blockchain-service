import { Injectable, Inject } from '@nestjs/common';
import Web3 from 'web3';
import { EthereumAccountRepository } from './repositories/ethereum-account.repository';
import { EthereumAccountEntity } from './entities/ethereum-account.entity';

@Injectable()
export class EthereumService {

    constructor(@Inject('WEB3') private readonly web3: Web3,
        private ethereumAccountRepository: EthereumAccountRepository) { }

    async createAccount(userId: string) {
        const account = this.web3.eth.accounts.create();
        await this.ethereumAccountRepository.saveAccount(userId, account);
    }

    async getAccount(userId: string) {
        const response = await this.ethereumAccountRepository.getAccount(userId);
        return { privateKey: response.private_key, address: response.address };
    }

    async getBalance(address: string) {
        const balance = await this.web3.eth.getBalance(address);
        return { balance };
    }

    async withdraw(userId:string, amount:string, recipientAddress:string) {
        try {
        const account: EthereumAccountEntity= await this.ethereumAccountRepository.getAccount(userId);
        const nonce = await this.web3.eth.getTransactionCount(account.address);
        const gasPriceWei: string = await this.web3.eth.getGasPrice();

        // Create a transaction object
        const txObject = {
        from: account.address,
        to: recipientAddress,
        value: this.web3.utils.toWei(amount, 'ether'), // Amount of Ether to send
        gas: 21000, // Fixed gas limit for ETH transfer
        gasPrice: gasPriceWei,
        nonce: nonce,
      };

    // Sign the transaction
      const signedTx = await this.web3.eth.accounts.signTransaction(txObject, account.private_key);

      // Send the signed transaction
      const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);

      console.log('Receipt:', receipt); 
    }
    catch (error) {
        console.error('Error:', error);
    }    
    }


    async deposit(userId: string, amount: number) {

    }

    async getAccountBy(userId: string){
        return await this.ethereumAccountRepository.findAccountBy(userId);
    }

}
