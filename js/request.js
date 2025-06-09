let config = {};

fetch('./config.json')
  .then(res => res.json())
  .then(json => {
    config = json;
  });

// Helper function to replace cordova.plugin.http with fetch API
function httpRequest(url, options = {}) {
    const method = options.method || 'GET';
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };
    
    const fetchOptions = {
        method,
        headers
    };
    
    if (options.data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        fetchOptions.body = JSON.stringify(options.data);
    }
    
    return fetch(url, fetchOptions)
        .then(response => {
            const statusCode = response.status;
            return response.text().then(text => {
                let data;
                try {
                    data = text ? JSON.parse(text) : {};
                } catch (e) {
                    data = text;
                }
                return { 
                    status: statusCode,
                    data 
                };
            });
        })
        .then(result => {
            if (options.successCallback) {
                options.successCallback(result);
            }
            return result;
        })
        .catch(error => {
            console.error('Request failed:', error);
            if (options.errorCallback) {
                options.errorCallback(error);
            }
            throw error;
        });
}

// Compatibility layer for code that may still use Cordova-style syntax
window.cordova = window.cordova || {};
window.cordova.plugin = window.cordova.plugin || {};
window.cordova.plugin.http = {
    get: function(url, params, headers, success, error) {
        httpRequest(url, {
            method: 'GET',
            params: params,
            headers: headers,
            successCallback: success,
            errorCallback: error
        });
    },
    post: function(url, data, headers, success, error) {
        httpRequest(url, {
            method: 'POST',
            data: data,
            headers: headers,
            successCallback: success,
            errorCallback: error
        });
    },
    put: function(url, data, headers, success, error) {
        httpRequest(url, {
            method: 'PUT',
            data: data,
            headers: headers,
            successCallback: success,
            errorCallback: error
        });
    },
    delete: function(url, params, headers, success, error) {
        httpRequest(url, {
            method: 'DELETE',
            params: params,
            headers: headers,
            successCallback: success,
            errorCallback: error
        });
    },
    sendRequest: function(url, options, success, error) {
        httpRequest(url, {
            method: options.method,
            data: options.data,
            params: options.params,
            headers: options.headers,
            successCallback: success,
            errorCallback: error
        });
    },
    setDataSerializer: function() {
        // No-op, fetch handles this automatically
        console.log('setDataSerializer: This function is a no-op in the fetch implementation');
    },
    setServerTrustMode: function(mode, success, error) {
        // No-op, not applicable in browser context
        if (typeof success === 'function') {
            success();
        }
    }
};

// Update the document event listener from deviceready to DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Document is ready - request.js');
    // Fire deviceready for backward compatibility
    const deviceReadyEvent = new Event('deviceready');
    document.dispatchEvent(deviceReadyEvent);
});