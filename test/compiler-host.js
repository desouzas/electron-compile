import './support.js';

import _ from 'lodash';
import path from 'path';
import rimraf from 'rimraf';
import mkdirp from 'mkdirp';
import FileChangeCache from '../lib/file-change-cache';
import CompilerHost from '../lib/compiler-host';

let testCount=0;

describe('The compiler host', function() {
  this.timeout(15*1000);

  beforeEach(function() {
    this.appRootDir = path.join(__dirname, '..');
    this.fileChangeCache = new FileChangeCache(this.appRootDir);
        
    this.tempCacheDir = path.join(__dirname, `__compile_cache_${testCount++}`);
    mkdirp.sync(this.tempCacheDir);
    
    this.compilersByMimeType = _.reduce(Object.keys(global.compilersByMimeType), (acc, type) => {
      let Klass = global.compilersByMimeType[type];
      acc[type] = new Klass();
      return acc;
    }, {});
    
    let InlineHtmlCompiler = Object.getPrototypeOf(this.compilersByMimeType['text/html']).constructor;
    this.compilersByMimeType['text/html'] = InlineHtmlCompiler.createFromCompilers(this.compilersByMimeType);
    
    this.fixture = new CompilerHost(this.tempCacheDir, this.compilersByMimeType, this.fileChangeCache, false);
  });
  
  afterEach(function() {
    rimraf.sync(this.tempCacheDir);
  });
  
  it('Should compile everything in the fixtures directory', async function() {
    let input = path.join(__dirname, '..', 'test', 'fixtures');

    await this.fixture.compileAll(input, (filePath) => {
      if (filePath.match(/invalid/)) return false;
      if (filePath.match(/binaryfile/)) return false;
      if (filePath.match(/minified/)) return false;
      if (filePath.match(/source_map/)) return false;
      
      return true;
    });
  });
  
  it('Should compile everything in the fixtures directory sync', function() {
    let input = path.join(__dirname, '..', 'test', 'fixtures');

    this.fixture.compileAllSync(input, (filePath) => {
      if (filePath.match(/invalid/)) return false;
      if (filePath.match(/binaryfile/)) return false;
      if (filePath.match(/minified/)) return false;
      if (filePath.match(/source_map/)) return false;
      
      return true;
    });
  });
  
  it('Should read files from cache once we compile them', async function() {
    let input = path.join(__dirname, '..', 'test', 'fixtures');

    await this.fixture.compileAll(input, (filePath) => {
      if (filePath.match(/invalid/)) return false;
      if (filePath.match(/binaryfile/)) return false;
      if (filePath.match(/minified/)) return false;
      if (filePath.match(/source_map/)) return false;
      
      return true;
    });
    
    this.fixture = new CompilerHost(this.tempCacheDir, this.compilersByMimeType, this.fileChangeCache, true);
    this.fixture.compileUncached = () => Promise.reject(new Error("Fail!"));

    await this.fixture.compileAll(input, (filePath) => {
      if (filePath.match(/invalid/)) return false;
      if (filePath.match(/binaryfile/)) return false;
      if (filePath.match(/minified/)) return false;
      if (filePath.match(/source_map/)) return false;
      
      return true;
    });
  });
});
