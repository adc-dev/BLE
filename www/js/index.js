/*global cordova, ble, deviceListScreen, unlockScreen, scrim, statusDiv, deviceList, refreshButton, disconnectButton*/

// Bluetooth Low Energy Lock (c) 2014-2015 Don Coleman

var SERVICE_UUID = 'D270';
//var UNLOCK_UUID = 'D271';
var PROGRAMUP_UUID = 'D271';
var PROGRAMDOWN_UUID = 'D272';
var MESSAGE_UUID = 'D273';

function stringToArrayBuffer(str) {
    // assuming 8 bit bytes
    var ret = new Uint8Array(str.length);
    for (var i = 0; i < str.length; i++) {
        ret[i] = str.charCodeAt(i);
        console.log(ret[i]);
    }
    return ret.buffer;
}

function bytesToString(buffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
}

var app = {
    initialize: function() {
        this.bindEvents();
        deviceListScreen.hidden = true;
        remoteControl.hidden = true;
    },
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        //document.forms[0].addEventListener('submit', this.unlock, false);
    },
    onDeviceReady: function() {
        deviceList.ontouchstart = app.connect; // assume not scrolling
        refreshButton.ontouchstart = app.scan;
        disconnectButton.onclick = app.disconnect;
		programUpButton.onclick = app.poweron;
		programDownButton.onclick = app.poweroff;
	
		
        app.scan();
    },
    scan: function(e) {
        deviceList.innerHTML = ""; // clear the list
        app.showProgressIndicator("Scanning for Bluetooth Devices...");

        ble.startScan([SERVICE_UUID],
            app.onDeviceDiscovered,
            function() { alert("Listing Bluetooth Devices Failed"); }
        );

        // stop scan after 5 seconds
        setTimeout(ble.stopScan, 5000, app.onScanComplete);

    },
    onDeviceDiscovered: function(device) {
        var listItem, rssi;

        app.showDeviceListScreen();

        console.log(JSON.stringify(device));
        listItem = document.createElement('li');
        listItem.dataset.deviceId = device.id;
        if (device.rssi) {
            rssi = "RSSI: " + device.rssi + "<br/>";
        } else {
            rssi = "";
        }
        listItem.innerHTML = device.name + "<br/>" + rssi + device.id;
        deviceList.appendChild(listItem);

        var deviceListLength = deviceList.getElementsByTagName('li').length;
        app.setStatus("Found " + deviceListLength +
                      " device" + (deviceListLength === 1 ? "." : "s."));
    },
    onScanComplete: function() {
        var deviceListLength = deviceList.getElementsByTagName('li').length;
        if (deviceListLength === 0) {
            app.showDeviceListScreen();
            app.setStatus("No Bluetooth Peripherals Discovered.");
        }
    },
    connect: function (e) {
        var device = e.target.dataset.deviceId;
        app.showProgressIndicator("Requesting connection to " + device);
        ble.connect(device, app.onConnect, app.onDisconnect);
    },
    onConnect: function(peripheral) {
        app.connectedPeripheral = peripheral;
        app.showRemoteControl();
        app.setStatus("Connected");
        ble.notify(peripheral.id, SERVICE_UUID, MESSAGE_UUID, app.onData);
    },
    onDisconnect: function(reason) {
        if (!reason) {
            reason = "Connection Lost";
        }
        app.hideProgressIndicator();
        app.showDeviceListScreen();
        app.setStatus(reason);
    },
    disconnect: function (e) {
        if (e) {
            e.preventDefault();
        }

        app.setStatus("Disconnecting...");
        ble.disconnect(app.connectedPeripheral.id, function() {
            app.setStatus("Disconnected");
            setTimeout(app.scan, 800);
        });
    },
    onData: function(buffer) {
        var message = bytesToString(buffer);
        app.setStatus(message);
        app.hideProgressIndicator();
    },
	poweron: function(e) {
		
        var code = "0x807F926D";
		app.showProgressIndicator();

        function success() {
            //e.target.code.value = ""; //  clear the input
        }

        function failure (reason) {
            //alert("Error sending code " + reason);
            app.hideProgressIndicator();
        }

        ble.write(
            app.connectedPeripheral.id,
            SERVICE_UUID,
            //UNLOCK_UUID,
			PROGRAMUP_UUID,
            stringToArrayBuffer(code),
            success, failure
        );

    },
	poweroff: function(e) {
		
        var code = "0x807F02FD";
		app.showProgressIndicator();

        function success() {
            //e.target.code.value = ""; //  clear the input
        }

        function failure (reason) {
            //alert("Error sending code " + reason);
            app.hideProgressIndicator();
        }

        ble.write(
            app.connectedPeripheral.id,
            SERVICE_UUID,
            //UNLOCK_UUID,
			PROGRAMDOWN_UUID,
            stringToArrayBuffer(code),
            success, failure
        );

    },
	
    showProgressIndicator: function(message) {
        if (!message) { message = "Processing"; }
        scrim.firstElementChild.innerHTML = message;
        scrim.hidden = false;
        statusDiv.innerHTML = "";
    },
    hideProgressIndicator: function() {
        scrim.hidden = true;
    },
    showDeviceListScreen: function() {
        remoteControl.hidden = true;
        deviceListScreen.hidden = false;
        app.hideProgressIndicator();
        statusDiv.innerHTML = "";
    },
    showRemoteControl: function() {
        remoteControl.hidden = false;
        deviceListScreen.hidden = true;
        app.hideProgressIndicator();
        statusDiv.innerHTML = "";
    },
    setStatus: function(message){
        console.log(message);
        statusDiv.innerHTML = message;
    }

};

app.initialize();
