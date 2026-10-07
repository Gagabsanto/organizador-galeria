set -e
cp GaleriaPlugin.java MainActivity.java android/app/src/main/java/com/tobias/galeria/
M=android/app/src/main/AndroidManifest.xml
sed -i 's|<application|<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" /><uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" /><uses-permission android:name="android.permission.MANAGE_EXTERNAL_STORAGE" /><application|' $M
grep -c MANAGE_EXTERNAL_STORAGE $M
