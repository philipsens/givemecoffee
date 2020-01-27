<?php
// error_reporting(E_ALL);
// ini_set('display_errors', 1);

$API_KEY = file_get_contents("yelp-api-key.txt");

$API_HOST = "https://api.yelp.com";
$SEARCH_PATH = "/v3/businesses/search";
$BUSINESS_PATH = "/v3/businesses/";

$DEFAULT_TERM = $_GET['term'];
$LATITUDE = $_GET['latitude'];
$LONGITUDE = $_GET['longitude'];
$RADIUS = $_GET['radius'];

function request($host, $path, $url_params = array()) {
  try {
    $curl = curl_init();
    if (FALSE === $curl)
      throw new Exception('Failed to initialize');

    $url = $host . $path . "?" . http_build_query($url_params);
    curl_setopt_array($curl, array(
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_ENCODING => "",  // Accept gzip/deflate/whatever.
      CURLOPT_MAXREDIRS => 10,
      CURLOPT_TIMEOUT => 30,
      CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
      CURLOPT_CUSTOMREQUEST => "GET",
      CURLOPT_HTTPHEADER => array(
        "authorization: Bearer " . $GLOBALS['API_KEY'],
        "cache-control: no-cache",
      ),
    ));

    $response = curl_exec($curl);

    if (FALSE === $response)
      throw new Exception(curl_error($curl), curl_errno($curl));

    $http_status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    if (200 != $http_status)
      throw new Exception($response, $http_status);

    curl_close($curl);
  } catch(Exception $e) {
    trigger_error(sprintf(
      'Curl failed with error #%d: %s',
      $e->getCode(), $e->getMessage()),
      E_USER_ERROR);
  }

  return $response;
}

function search($term, $latitude, $longitude, $radius) {
  $url_params = array();

  $url_params['term'] = $term;
  $url_params['latitude'] = $latitude;
  $url_params['longitude'] = $longitude;
  $url_params['open_now'] = true;
  $url_params['limit'] = 50;
  $url_params['radius'] = $radius;

  return request(
    $GLOBALS['API_HOST'],
    $GLOBALS['SEARCH_PATH'],
    $url_params
  );
}

function get_business($business_id) {
  $business_path = $GLOBALS['BUSINESS_PATH'] . urlencode($business_id);

  return request($GLOBALS['API_HOST'], $business_path);
}

function query_api($term, $latitude, $longitude, $radius) {
  $response = search($term, $latitude, $longitude, $radius);

  $pretty_response = json_encode(
    json_decode($response),
    JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES
  );

  header('Content-type: application/json');
  print "$pretty_response\n";
}

query_api(
  $GLOBALS['DEFAULT_TERM'],
  $GLOBALS['LATITUDE'],
  $GLOBALS['LONGITUDE'],
  $GLOBALS['RADIUS']
);
