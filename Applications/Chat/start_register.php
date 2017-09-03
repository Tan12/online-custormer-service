<?php 
use \Workerman\Worker;
use \GatewayWorker\Register;

// 自动加载类
require_once __DIR__ . '/../../vendor/autoload.php';

// register服务必须是text协议
// Gateway进程和BusinessWorker进程启动后分别向Register进程注册自己的通讯地址
// Gateway进程和BusinessWorker通过Register进程得到通讯地址后，就可以建立起连接并通讯了
// 这个端口是用于GatewayWorker内部通信用的
$register = new Register('text://0.0.0.0:1236');

// 如果不是在根目录启动，则运行runAll方法
if(!defined('GLOBAL_START')){
    Worker::runAll();
}

