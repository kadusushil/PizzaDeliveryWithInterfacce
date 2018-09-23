/**
 * Provides CRUD operations on fileNames
 **/


const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

var data = {};

data.baseDir = path.join('__dirname', './../.data');

/**
 * Creates the directories needed for the functioning of remaining api's.
 * This must called when server starts.
 * Reason we are doing this, not to waste any time trying to set up environments
 * on new machine, this method shall be able to take care of setting up things
 * required for working this part of the project.
 **/
data.init = () => {
  // create base directory
  fs.mkdir(data.baseDir, (error)=> {
    if (!error) {
      console.log('');
      // create user
      fs.mkdir(data.baseDir + '/users', (error)=> {
        if (!error) {
          // create token directory
          fs.mkdir(data.baseDir + '/tokens', (error)=> {
            if (!error) {
              console.log('Successfully created all required directories');
            } else {
              console.log('Failed creating token directory');
            }
          });
        } else {
          console.log('Failed creating user directory');
        }
      });
    } else {
      console.log('Folders already exists');
    }
  });
};

/**
 * Creates new file and stores the provided content into it.
 * - Receive no error if the file created and contents are stored.
 * - If the file already exists then this will return an error
 **/
data.createFile = (destFolder, destFilename, content, callback) => {
  var filePath = path.join(data.baseDir, destFolder, destFilename+'.json');
  fs.open(filePath, 'wx', (error, fd)=> {
    if (!error && fd) {
      var stringData = JSON.stringify(content);
      fs.writeFile(fd, stringData, 'utf-8', (error)=> {
        if (!error) {
          callback(false);
        } else {
          callback('Error writing data to file');
        }
      });
    } else {
      callback('Error creating file');
    }
  });
};

data.readFile = (destFolder, destFile, callback) => {
  const filePath = path.join(data.baseDir, destFolder, destFile+'.json');

  fs.open(filePath,'r', (error, fd)=> {
    if (!error && fd) {
      fs.readFile(fd, 'utf-8', (error, data)=> {
        if (!error && data) {
          // we need to check if this the data we wish to return.
          // this is string data
          const objData = helpers.convertJsonToObject(data);
          callback(error, objData);
        } else {
          callback('Error: File could not be read');
        }
      });
    } else {
      callback('Error: File could not be read');
    }
  });
};

/**
 * Deletes the input file if it exists.
 **/
 data.deleteFile = (destFolder, destFile, callback)=> {
   const filePath = path.join(data.baseDir, destFolder, destFile+'.json');
   fs.unlink(filePath, (error)=> {
      if (!error) {
        callback(false);
      } else {
        callback(error);
      }
   });
 };

 data.updateFile = (destFolder, destFile, content, callback) => {
   const filePath = path.join(data.baseDir, destFolder, destFile+'.json');

   fs.truncate(filePath, (error) => {
     if (!error) {
       fs.open(filePath, 'a+', (error, fd) => {
         if (!error && fd) {
           var stringData = JSON.stringify(content);
           fs.writeFile(fd, stringData, 'utf-8', (error)=> {
             if (!error) {
               callback(false);
             } else {
               callback('error: could not update the content');
             }
           });
         } else {
           callback('error: file does not exists');
         }
       });
     } else {
       callback('error: failed to truncate the file');
     }
   });
 };

 data.listFiles = (destFolder, removeExtention, callback) => {
   const folderPath = path.join(data.baseDir, destFolder);
   fs.readdir(folderPath, (error, fileNameArray)=> {
     if (!error && fileNameArray && fileNameArray.length > 0) {
       if (removeExtention) {
         const updatedFileNameArray = [];
         fileNameArray.forEach((fileName)=> {
           updatedFileNameArray.push(fileName.replace('.json',''));
         });
         callback(false, updatedFileNameArray);
       } else {
         callback(false, fileNameArray);
       }
     } else {
       callback(error);
     }
   });
 };

module.exports = data;
