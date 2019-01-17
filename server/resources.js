module.exports = (isMock) => {
  return {
    dh11_fileLocation: (!isMock) ? '/media/pi/PartA/sensor_data/dht11.csv' : '/home/saii/dh11.csv'
  }
}