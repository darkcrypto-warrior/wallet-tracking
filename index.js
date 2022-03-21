const recipient = "";
const privateKey = "";


const Web3 = require('web3');
const rpc = "https://rpc.vvs.finance";
const web3 = new Web3(rpc);
const Promise = require('bluebird');
const BigNumber = require('bignumber.js');
const crc20ABI = require('./crc20.json');

let account = web3.eth.accounts.wallet.add(privateKey);

const tokenList = [{
    symbol: "DARK",
    address: "0x83b2AC8642aE46FC2823Bc959fFEB3c1742c48B5"
},{
    symbol: "SKY",
    address: "0x9D3BBb0e988D9Fb2d55d07Fe471Be2266AD9c81c"
},{
    symbol: "CRN",
    address: "0x8174BaC1453c3AC7CaED909c20ceaDeb5E1CDA00"
}]

const trackingToken = async (symbol, tokenAddress) =>{
    const contract = new web3.eth.Contract(crc20ABI, tokenAddress);
    const walletAddress = account.address;
    console.log(`Start tracking ${symbol} on account ${walletAddress}`);

    while(true){
        const balance = await contract.methods.balanceOf(walletAddress).call();
        console.log(`${symbol} balance: ${Web3.utils.fromWei(balance)}`);
        const balanceBN = new BigNumber(balance)
        if(balanceBN.gt(0)){
            const func = async() => {
                console.log(`----------------------------------------------------`)
                console.log(`Detected ${symbol} balance > 0. Starting transfer to new wallet`);
                console.log(`----------------------------------------------------`)
                const nonce = await web3.eth.getTransactionCount(account.address);
                const gasPrice = await web3.eth.getGasPrice();

                const gas = await contract.methods.transfer(recipient, balance)
                .estimateGas({
                    from: account.address,
                    nonce: nonce,
                });

                const data = await contract.methods.transfer(recipient, balance)
                .send({
                    from: account.address,
                    gasPrice: gasPrice,
                    gas: gas,
                    nonce: nonce,
                });
                console.log(`Transfer ${symbol} to address ${recipient} successfull. tx hash: ${data.transactionHash}`);
            }

            try{
                await new Promise((resolve, reject) =>{
                    setTimeout(()=> reject('timeout'), 10000);

                    func()
                    .then(()=> resolve())
                    .catch(e => reject(e));
                })
            }catch(e){
                console.error('Exception', e)
            }
        }

        await Promise.delay(2000) //waiting 2 seconds for the next fetching time
    }
}

const checkCROBalance = async ()=>{
    while(true){
        const croWei = await web3.eth.getBalance(account.address);
        const cro = parseFloat(Web3.utils.fromWei(croWei));
        if(cro < 10){
            console.log(`----------------------------------------------------`)
            console.log(`!!!!!!WARNING CRO BALANCE TOO LOW: (${cro} CRO)`)
            console.log(`----------------------------------------------------`)
        }
        await Promise.delay(10000);
    }
}

const monitor = async()=>{
    checkCROBalance();

    tokenList.forEach(token =>{
        trackingToken(token.symbol, token.address)
    })
}

monitor();