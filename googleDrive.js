'use strict';

/**
 * An angular service for the Google Drive API.
 * https://developers.google.com/drive/
 * @author: chedazzle
 * @version: 0.1.0, 2014-01-1
 */

angular.module('googleDrive', []).

  constant('Config', {
    clientId: '',
    scopes: 'https://www.googleapis.com/auth/drive'
  }).

  factory('$googleDrive', ['$http', '$q', 'Config', function GoogleDriveFactory($http, $q, Config) {

    return {

      /**
       * Get an oauth token and handle auth.
       * https://www.googleapis.com/auth/drive
       */
      load: function() {
        var deferred = $q.defer();

        var onAuth = function(authResult) {
          if (authResult && !authResult.error) {
            gapi.client.load('drive', 'v2', function() {
              console.log('google drive v2 loaded');
              deferred.resolve(authResult);
            });
          } else { deferred.reject( {name: 'gapi auth failed'} )}
        };

        gapi.auth.authorize({
            client_id: Config.clientId,
            scope: Config.scopes,
            immediate: true // reauthorizes without popup
          }, onAuth
        );

        return deferred.promise;
      },

      /**
       * Get drive folders.
       * https://developers.google.com/drive/folder
       */
      getFolders: function() {
        var deferred = $q.defer();

        var request = gapi.client.drive.files.list({
          'q': "mimeType = 'application/vnd.google-apps.folder' and trashed = false"
        });

        request.execute(function(resp) {
          console.log(resp);
          deferred.resolve(resp);
        });

        return deferred.promise;
      },

      /**
       * Retrieve a list of files belonging to a folder.
       *
       * @param {String} folderId ID of the folder to retrieve files from.
       * https://developers.google.com/drive/search-parameters
       *
       */
      getChildren: function(folderId) {
        var deferred = $q.defer();

        var request = gapi.client.drive.files.list({
          'q': "'"+folderId+"' in parents and trashed = false"
        });

        request.execute(function(resp) {
          console.log(resp);
          deferred.resolve(resp);
        });

        return deferred.promise;
      },

      /**
       *y Search for files by title.
       *
       * @param {String} query Name of the file.
       * https://developers.google.com/drive/search-parameters
       *
       */
      searchFiles: function(query) {
        var deferred = $q.defer();

        var request = gapi.client.drive.files.list({
          'q': "title contains '"+query+"' and trashed = false"
        });

        request.execute(function(resp) {
          console.log(resp);
          deferred.resolve(resp);
        });

        return deferred.promise;
      },

      /**
       * Create a drive folder.
       * @param {String} title Name of folder.
       */
      createFolder: function(parent, title) {
        var deferred = $q.defer();

        var request = gapi.client.drive.files.insert({
          'resource': {
              'title': title || 'CiscoTemp',
              'mimeType': 'application/vnd.google-apps.folder'
              // 'parents': [{'id': parent.id}] TODO: add sub folder support
            }
        });

        request.execute(function(resp) {
          deferred.resolve(resp);
        });

        return deferred.promise;
      },

      /**
       * Create a drive file w/metadata.
       * https://developers.google.com/drive/v2/reference/files
       *
       * @param {String} title Name of file.
       * @param {String} description File description.
       */
      createFile: function(title, description) {
        var deferred = $q.defer();
        var request = gapi.client.request({
          'path': '/drive/v2/files',
          'method': 'POST',
          'body':{
              "title" : title,
              "description" : description
          }
        });
        request.execute(function(resp) {
          deferred.resolve(resp);
        });
        return deferred.promise;
      },

      /**
       * Simple upload.
       * https://developers.google.com/drive/manage-uploads#simple
       *
       * @param {String} title Name of file.
       * @param {String} description File description.
       */
      updateFile: function(jsonObj) {
        var deferred = $q.defer();
        $http({
            method: 'POST',
            url: 'https://www.googleapis.com/upload/drive/v2/files/?uploadType=media',
            headers: {
              'Authorization' : 'Bearer ' + gapi.auth.getToken().access_token,
              'Content-Type'  : 'application/json;charset=UTF-8'},
            data: JSON.stringify(jsonObj)
          }).
          success(function(data) {
            deferred.resolve(data);
          }).
          error(function(data, status, headers, config) {
            deferred.reject({
              name: 'error_response',
              data: data,
              status: status,
              headers: headers,
              config: config
            });
          });
        return deferred.promise;
      },

      /**
       * Download a drive file.
       */
      downloadFile: function(fileId) {
        var request = gapi.client.drive.files.get({
          'fileId': fileId
        });

        request.execute(function(resp) {
          var file = resp;

          if (file.downloadUrl) {
            var accessToken = gapi.auth.getToken().access_token;
            var xhr = new XMLHttpRequest();
            xhr.open('GET', file.downloadUrl);
            xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
            xhr.onload = function() {
              console.log(xhr.responseText);
            };
            xhr.onerror = function() {
              console.log('error downloading file')
            };
            xhr.send();
          } else {
            console.log('file has no download url')
          }

        });
      }

    };
  }]);




