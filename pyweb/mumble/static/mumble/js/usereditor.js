// kate: space-indent on; indent-width 2; replace-tabs on;

Ext.namespace('Ext.ux');

Ext.ux.UserEditorPanel = function( config ){
  Ext.apply( this, config );

  userRecord = Ext.data.Record.create([
    { name: 'id',       type: 'int'    },
    { name: 'name',     type: 'string' },
    { name: 'password', type: 'string' },
    { name: 'owner',    type: 'int'    },
    { name: 'admin',    type: 'bool'   },
    { name: 'delete',   type: 'bool'   }
    ]);

  userAdminStore = new Ext.data.DirectStore({
    baseParams: { server: this.server, resync: false },
    directFn: MumbleUserAdmin.users,
    fields:   userRecord,
    paramOrder: ['server', 'resync'],
    autoLoad: true,
    remoteSort: false
    });

  adminColumn = new Ext.grid.CheckColumn({
    header:    gettext("Admin on root channel"),
    dataIndex: 'admin',
    width:     50
    });

  deleteColumn = new Ext.grid.CheckColumn({
    header:    gettext("Delete"),
    dataIndex: 'delete',
    width:     50
    });

  ownerCombo = new Ext.form.ComboBox({
    name:           'owner',
    hiddenName:     'owner_id',
    forceSelection: true,
    triggerAction:  'all',
    valueField:     'uid',
    displayField:   'uname',
    store: new Ext.data.DirectStore({
      directFn: MumbleUserAdmin.djangousers,
      fields:   [ 'uid', 'uname' ],
      autoLoad: true
      })
    });

  Ext.applyIf( this, {
    title:  gettext("User List"),
    store:  userAdminStore,
    viewConfig: { forceFit: true },

    cm: new Ext.grid.ColumnModel( [ {
        header:    gettext("name"),
        dataIndex: 'name',
        sortable:  true,
        editor:    new Ext.form.TextField({
          allowBlank: false
          })
      }, {
        header:    gettext("Account owner"),
        dataIndex: 'owner',
        editor:    ownerCombo,
        sortable:  true,
        renderer:  function( value ){
          if( value == '' ) return '';
          items = ownerCombo.store.data.items;
          for( i = 0; i < items.length; i++ )
            if( items[i].data.uid == value )
              return items[i].data.uname;
          }
      }, adminColumn, {
        header:    gettext("Change password"),
        dataIndex: 'password',
        editor: new Ext.form.TextField({
          inputType: 'password'
          }),
        renderer: function( value ){
          ret = '';
          for( i = 0; i < value.length; i++ )
            ret += '*';
          return ret;
          }
      }, deleteColumn ] ),

    buttons:   [{
        text:     gettext("Add"),
        handler : function(){
          userAdminStore.add( new userRecord( {
            id:       -1,
            name:     gettext('New User'),
            admin:    false,
            owner:    '',
            password: '',
            'delete': false
          } ) );
        }
      }, {
        text:     gettext("Save"),
        scope: this,
        handler : function(){
          var data = [];
          for( i = 0; i < userAdminStore.data.items.length; i++ ){
            var rec = userAdminStore.data.items[i];
            if( rec.dirty ){
              data.push(rec.data);
            }
          }
          MumbleUserAdmin.update( this.server, data, function(provider, response){
            if( response.result.success ){
              for( i = 0; i < userAdminStore.data.items.length; i++ ){
                rec = userAdminStore.data.items[i];
                if( rec.data['delete'] == true )
                  userAdminStore.remove( rec );
                else if( rec.dirty ){
                  rec.commit();
                }
              }
            }
            else{
              Ext.Msg.show({
                title: gettext("Submit error"),
                msg:   gettext("Unable to save."),
                icon:  Ext.MessageBox.ERROR,
                buttons: Ext.MessageBox.OK
                });
            }
          });
        }
      }, {
        text:    gettext("Refresh"),
        handler: function(){
          userAdminStore.reload({
            params: { 'resync': false }
          });
        }
      }, {
        text:    gettext("Resync with Murmur"),
        handler: function(){
          userAdminStore.reload({
            params: { 'resync': true }
          });
        }
      }],
    plugins: [ adminColumn, deleteColumn ]
  });
  Ext.ux.UserEditorPanel.superclass.constructor.call( this );
};

Ext.extend( Ext.ux.UserEditorPanel, Ext.grid.EditorGridPanel, {
} );

Ext.reg( 'userEditorPanel', Ext.ux.UserEditorPanel );
