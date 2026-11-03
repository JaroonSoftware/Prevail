<?php
ob_start();
include_once dirname(__DIR__) . '/onload.php';
$conn = (new DbConnect)->connect();
try {
 $method=$_SERVER['REQUEST_METHOD'];
 if (!in_array($method,['GET','POST','PUT','DELETE'],true)) throw new InvalidArgumentException('Invalid method');
 if (!$conn->query("SHOW TABLES LIKE 'catalog_group'")->fetch()) throw new InvalidArgumentException('ยังไม่มีตาราง catalog_group กรุณาติดตั้งโครงสร้างหมวดก่อนใช้งาน');
 if ($method!=='GET') {
  $body=json_decode(file_get_contents('php://input'),true)?:[];
  $id=(int)($body['group_id']??$_GET['group_id']??0);
  $conn->beginTransaction();
  $conn->query('SELECT group_id FROM catalog_group ORDER BY group_id FOR UPDATE')->fetchAll();
  if ($method!=='POST') {
   $q=$conn->prepare("SELECT group_id FROM catalog_group WHERE group_id=:id AND active_status='Y'");$q->execute(['id'=>$id]);
   if(!$q->fetch()) throw new InvalidArgumentException('ไม่พบหมวด กรุณาโหลดใหม่');
  }
  if($method==='DELETE') {
   if($conn->query("SHOW COLUMNS FROM items LIKE 'catalog_group_id'")->fetch()) {
    $q=$conn->prepare('SELECT COUNT(*) FROM items WHERE catalog_group_id=:id');$q->execute(['id'=>$id]);
    if((int)$q->fetchColumn()>0) throw new InvalidArgumentException('มีสินค้าอ้างอิงหมวดนี้ กรุณาย้ายสินค้าไปหมวดอื่นก่อนลบ');
   }
   $q=$conn->prepare("UPDATE catalog_group SET active_status='N' WHERE group_id=:id");$q->execute(['id'=>$id]);
  } else {
   $name=trim((string)($body['group_name']??''));$seq=filter_var($body['seq']??0,FILTER_VALIDATE_INT);
   if($name===''||mb_strlen($name)>100)throw new InvalidArgumentException('ระบุชื่อหมวดไม่เกิน 100 ตัวอักษร');
   if($seq===false||$seq<0||$seq>9999)throw new InvalidArgumentException('ลำดับต้องเป็นจำนวนเต็ม 0-9999');
   $q=$conn->prepare('SELECT group_id FROM catalog_group WHERE group_name=:name AND group_id<>:id');$q->execute(['name'=>$name,'id'=>$method==='POST'?0:$id]);
   if($q->fetch())throw new InvalidArgumentException('ชื่อหมวดนี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น');
   if($method==='POST'){$q=$conn->prepare("INSERT INTO catalog_group(group_name,seq,active_status) VALUES(:name,:seq,'Y')");$q->execute(['name'=>$name,'seq'=>$seq]);}
   else {$q=$conn->prepare('UPDATE catalog_group SET group_name=:name,seq=:seq WHERE group_id=:id');$q->execute(['name'=>$name,'seq'=>$seq,'id'=>$id]);}
  }
  $conn->commit();
 }
 $rows=$conn->query("SELECT group_id,group_name,seq FROM catalog_group WHERE active_status='Y' ORDER BY seq,group_id")->fetchAll(PDO::FETCH_ASSOC);
 http_response_code(200);echo json_encode(['status'=>1,'data'=>$rows]);
} catch(Throwable $e){
 if($conn&&$conn->inTransaction())$conn->rollBack();
 http_response_code($e instanceof InvalidArgumentException?400:500);
 if(!($e instanceof InvalidArgumentException))error_log('[catalog/groups] '.$e->getMessage());
 echo json_encode(['status'=>0,'message'=>$e instanceof InvalidArgumentException?$e->getMessage():'จัดการหมวดไม่สำเร็จ กรุณาตรวจโครงสร้างหมวดและลองใหม่']);
}
$conn=null;ob_end_flush();
