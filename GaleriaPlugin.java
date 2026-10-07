package com.tobias.galeria;
import android.Manifest;
import android.content.ContentUris;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.database.Cursor;
import android.provider.MediaStore;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
@CapacitorPlugin(name = "Galeria", permissions = {
  @Permission(alias = "fotos", strings = { Manifest.permission.READ_MEDIA_IMAGES }),
  @Permission(alias = "fotosAntigo", strings = { Manifest.permission.READ_EXTERNAL_STORAGE })
})
public class GaleriaPlugin extends Plugin {
  private String alias() { return android.os.Build.VERSION.SDK_INT >= 33 ? "fotos" : "fotosAntigo"; }
  @PluginMethod
  public void estado(PluginCall call) {
    JSObject r = new JSObject();
    r.put("sdk", android.os.Build.VERSION.SDK_INT);
    r.put("permissao", getPermissionState(alias()).toString());
    call.resolve(r);
  }
  @PluginMethod
  public void acessoTotal(PluginCall call) {
    JSObject r = new JSObject();
    boolean ok = android.os.Build.VERSION.SDK_INT < 30 || android.os.Environment.isExternalStorageManager();
    r.put("ativo", ok);
    call.resolve(r);
  }
  @PluginMethod
  public void pedirAcessoTotal(PluginCall call) {
    try {
      Intent i = new Intent(android.provider.Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION, Uri.parse("package:" + getContext().getPackageName()));
      i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      getContext().startActivity(i);
      call.resolve();
    } catch (Exception e) {
      call.reject("Não consegui abrir a tela de permissão: " + e.getMessage());
    }
  }
  @PluginMethod
  public void apagar(PluginCall call) {
    try {
      JSArray uris = call.getArray("uris");
      boolean permanente = Boolean.TRUE.equals(call.getBoolean("permanente", false));
      int ok = 0;
      int falha = 0;
      for (int i = 0; i < uris.length(); i++) {
        Uri u = Uri.parse(uris.getString(i));
        try {
          int n;
          if (!permanente && android.os.Build.VERSION.SDK_INT >= 30) {
            ContentValues v = new ContentValues();
            v.put(MediaStore.MediaColumns.IS_TRASHED, 1);
            n = getContext().getContentResolver().update(u, v, null, null);
          } else {
            n = getContext().getContentResolver().delete(u, null, null);
          }
          if (n > 0) ok++; else falha++;
        } catch (Exception e) {
          falha++;
        }
      }
      JSObject r = new JSObject();
      r.put("ok", ok);
      r.put("falha", falha);
      call.resolve(r);
    } catch (Exception e) {
      call.reject("Erro ao apagar: " + e.getMessage());
    }
  }
  @PluginMethod
  public void listar(PluginCall call) {
    if (getPermissionState(alias()) != PermissionState.GRANTED) {
      requestPermissionForAlias(alias(), call, "depoisPermissao");
      return;
    }
    ler(call);
  }
  @PermissionCallback
  private void depoisPermissao(PluginCall call) {
    if (getPermissionState(alias()) == PermissionState.GRANTED) ler(call);
    else call.reject("Permissão de fotos negada. Ative em Configurações > Apps > Organizador de Galeria > Permissões > Fotos e vídeos.");
  }
  private void ler(PluginCall call) {
    try {
      JSArray arr = new JSArray();
      String[] cols = { MediaStore.Images.Media._ID, MediaStore.Images.Media.DATA, MediaStore.Images.Media.WIDTH, MediaStore.Images.Media.HEIGHT };
      Cursor c = getContext().getContentResolver().query(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, cols, null, null, MediaStore.Images.Media.DATE_ADDED + " DESC");
      if (c != null) {
        int ci = c.getColumnIndex(MediaStore.Images.Media._ID);
        int cd = c.getColumnIndex(MediaStore.Images.Media.DATA);
        int cw = c.getColumnIndex(MediaStore.Images.Media.WIDTH);
        int ch = c.getColumnIndex(MediaStore.Images.Media.HEIGHT);
        while (c.moveToNext()) {
          String p = c.getString(cd);
          if (p == null || p.contains("/.")) continue;
          JSObject o = new JSObject();
          o.put("path", p);
          o.put("uri", ContentUris.withAppendedId(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, c.getLong(ci)).toString());
          o.put("w", c.getInt(cw));
          o.put("h", c.getInt(ch));
          arr.put(o);
        }
        c.close();
      }
      android.util.DisplayMetrics dm = new android.util.DisplayMetrics();
      getActivity().getWindowManager().getDefaultDisplay().getRealMetrics(dm);
      JSObject res = new JSObject();
      res.put("fotos", arr);
      res.put("telaW", dm.widthPixels);
      res.put("telaH", dm.heightPixels);
      call.resolve(res);
    } catch (Exception e) {
      call.reject("Erro ao ler a galeria: " + e.getMessage());
    }
  }
}
