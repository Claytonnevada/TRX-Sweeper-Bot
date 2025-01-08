const TronWeb = require('tronweb');
const sleep = require('util').promisify(setTimeout);

// Configure TronWeb
const tronWeb = new TronWeb({
    fullHost: 'https://api.trongrid.io',
    privateKey: 'your key'
});

// Address to send TRX to
const destinationAddress = 'youraddress';

// Function to estimate gas fee based on transaction size
async function estimateGasFee() {
    try {
        const dummyTx = await tronWeb.transactionBuilder.sendTrx(destinationAddress, 1, tronWeb.defaultAddress.base58);
        const transactionSize = Buffer.byteLength(JSON.stringify(dummyTx.raw_data)); // Size in bytes
        const baseFee = 0.1; // Base fee for a transaction in TRX
        const gasFee = baseFee + (transactionSize / 1024) * 0.001; // Fee per kilobyte
        return gasFee;
    } catch (error) {
        console.error('An error occurred while estimating gas fee:', error);
        return null;
    }
}

// Function to check balance and withdraw TRX
async function checkAndWithdraw() {
    try {
        const balance = await tronWeb.trx.getBalance(tronWeb.defaultAddress.base58) / 1e6; // Convert to TRX
        console.log(`Current balance: ${balance} TRX`);

        const gasFee = await estimateGasFee();
        if (gasFee === null) {
            console.log('Could not calculate gas fee. Skipping withdrawal.');
            return;
        }

        if (balance > gasFee) {
            const amountToSend = balance - gasFee; // Send the remaining balance after deducting gas fee
            const transaction = await tronWeb.transactionBuilder.sendTrx(destinationAddress, amountToSend * 1e6, tronWeb.defaultAddress.base58); // Convert to SUN
            const signedTransaction = await tronWeb.trx.sign(transaction);
            const result = await tronWeb.trx.sendRawTransaction(signedTransaction);
            console.log(`Sent ${amountToSend} TRX to ${destinationAddress}`, result);
        } else {
            console.log('Insufficient balance to cover gas fee');
        }
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

// Main loop to check for deposits
async function main() {
    console.log('Listening for TRX deposits...');
    while (true) {
        await checkAndWithdraw();
        await sleep(30000); // Check every 30 seconds
    }
}

main();
