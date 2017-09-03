<?php 
use \Workerman\Worker;
use \Workerman\WebServer;
use \GatewayWorker\Gateway;
use \GatewayWorker\BusinessWorker;
use \Workerman\Autoloader;


// 自动加载类
require_once __DIR__ . '/../../vendor/autoload.php';

// WebServer
$web = new WebServer("http://0.0.0.0:2347");
// WebServer数量
$web->count = 1;
// 设置站点根目录
$web->addRoot('www.your_domain.com', __DIR__.'/Web');
// 更改网站入口文件
//$webserver->setRoot('www.your_domain.com', '/home/www');

// 如果不是在根目录启动，则运行runAll方法
if(!defined('GLOBAL_START')){
    Worker::runAll();
}

