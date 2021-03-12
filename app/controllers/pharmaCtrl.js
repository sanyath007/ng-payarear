app.controller('pharmaController', [
    '$rootScope',
    '$scope',
    '$http',
    'CONFIG',
    '$location',
    '$localStorage',
    'StringFormatService',
    'toaster',
    function($rootScope, $scope, $http, CONFIG, $location, $localStorage, StringFormatService, toaster)
    {
        $scope.cboDrugItems = '';
        $scope.cboUserDrugLists = '';

        $scope.data = [];
        $scope.pager = null;
        $scope.drugLists = [];
        $scope.drugItems = [];
        $scope.userDrugLists = [];
        $scope.userDrugListsIcodes = [];
        $scope.userDrugList = {
            user_id: '',
            name: '',
            type: '',
            icodes: ''
        };

        $scope.getDrugItems = function(e) {
            if (e) e.preventDefault();

            $http.get(`${CONFIG.apiUrl}/drug-items`)
            .then(res => {
				$scope.drugItems = res.data.drugItems;
			}, err => {
				console.log(err)
			});
        };

        const createDrugListsToDB = function () {
            let icodes = "";

            for(let i = 0; i < $scope.drugLists.length; i++) {
                if(i !== $scope.drugLists.length - 1) {
                    icodes += "'" +$scope.drugLists[i].icode+ "', "
                } else {
                    icodes += "'" +$scope.drugLists[i].icode+ "'"
                }
            }

            return icodes;
        };
        
        $scope.storeDrugList = function(e) {
            if (e) e.preventDefault();
            if ($scope.drugLists.length === 0) {
                alert('ไม่พบรายการยาของคุณ!!');
                return false;
            }

            if ($localStorage.currentUser) {
                const { username } = $localStorage.currentUser;

                let data = {
                    user_id: username,
                    name: $scope.userDrugList.name,
                    type: $scope.userDrugList.type,
                    icodes: createDrugListsToDB()
                };
    
                $http.post(`${CONFIG.apiUrl}/pharma/store-drug-list`, data)
                .then(res => {
                    console.log(res);
                    toaster.pop('success', "", 'บันทึกข้อมูลสำเร็จ !!!');
                }, err => {
                    console.log(err)
                    toaster.pop('error', "", 'เกิดข้อผิดพลาด ไม่สามารถบันทึกข้อมูลได้ !!!');
                });

                $location.path("/pharma/user-druglists");
            } else {
                alert('คุณไม่สามารถบันทึกข้อมูลได้ กรุณา Log in เข้าสู่ระบบก่อน!!');
                return false;
            }
        };

        $scope.addDrugToDrugList = function(e) {
            if (e) e.preventDefault();

            if ($scope.drugLists.find(drug => drug.icode === $scope.cboDrugItems)) {
                alert('รายการที่คุณเลือกมีอยู่แล้ว!!');
                return false;
            }

            const dl = $scope.drugItems.find(drug => drug.icode === $scope.cboDrugItems);

            const { icode, name, strength, units, unitprice } = dl;

            $scope.drugLists.push({ icode, name, strength, units, unitprice });
        };

        $scope.removeItemFromDrugList = function(icode) {
            $scope.drugLists.forEach((drug, index) => {
                if(drug.icode === icode) {
                    $scope.drugLists.splice(index, 1);
                    return false;
                }
            });
        };

        $scope.removeUserDrugList = function(id) {
            if ($localStorage.currentUser) {
                if (confirm(`คุณต้องการลบรายการยา ID : ${id} ใช่หรือไม่?`)) {
                    $http.delete(`${CONFIG.apiUrl}/pharma/user-drug-list/${id}`, )
                    .then(res => {
                        if(res.data.status === 1) {
                            toaster.pop('success', "", 'ลบข้อมูลเรียบร้อยแล้ว !!!');
                            
                            $scope.userDrugLists = $scope.userDrugLists.filter(dl => dl.id !== id);
                        }
                    }, err => {
                        console.log(err)
                        toaster.pop('error', "", 'เกิดข้อผิดพลาด ไม่สามารถลบข้อมูลได้ !!!');
                    });
                }
            } else {
                alert('คุณไม่สามารถบันทึกข้อมูลได้ กรุณา Log in เข้าสู่ระบบก่อน!!');
                return false;
            }
        };

        $scope.getUserDrugLists = function(e) {
            if ($localStorage.currentUser) {
                const { username } = $localStorage.currentUser;

                $http.get(`${CONFIG.apiUrl}/pharma/user-drug-list/${username}`)
                .then(res => {
                    $scope.userDrugLists = res.data.userDrugLists;
                }, err => {
                    console.log(err)
                });
            } else {
                $rootScope.showLogin();
                alert('คุณไม่สามารถบันทึกข้อมูลได้ กรุณา Log in เข้าสู่ระบบก่อน!!');
                return false;
            }
        };

        $scope.showUserDrugListsDetail = (e, id) => {
            e.preventDefault();
            
            $http.get(`${CONFIG.apiUrl}/pharma/user-drug-list/${id}/detail?page=1`)
            .then(res => {
                $scope.userDrugListsIcodes = res.data.items;
                $scope.pager = res.data.pager;

                $('#drugList').modal('show');
            }, err => {
                console.log(err)
            });
        };

        $scope.onPaginateLinkClick = (e, link) => {
            e.preventDefault();
            
            $http.get(link)
            .then(res => {
                $scope.userDrugListsIcodes = res.data.items;
                $scope.pager = res.data.pager;
            }, err => {
                console.log(err)
            });
        };

        $scope.getOp = function(e) {
            if(e) e.preventDefault();
            
            let startDate = ($('#sdate').val() !== '') 
                            ? StringFormatService.convToDbDate($scope.sdate) 
                            : moment().format('YYYY-MM-DD');
            let endDate = ($('#edate').val() !== '') 
                            ? StringFormatService.convToDbDate($scope.edate) 
                            : moment().format('YYYY-MM-DD');

            $http.get(`${CONFIG.apiUrl}/pharma/op/${$scope.cboUserDrugLists}/${startDate}/${endDate}`)
            .then(res => {
                $scope.data = res.data;
            }, err => {
                console.log(err)
            });
        };
        
        $scope.getIp = function(e) {
            if(e) e.preventDefault();

            let startDate = ($('#sdate').val() !== '') 
                            ? StringFormatService.convToDbDate($scope.sdate) 
                            : moment().format('YYYY-MM-DD');
            let endDate = ($('#edate').val() !== '') 
                            ? StringFormatService.convToDbDate($scope.edate) 
                            : moment().format('YYYY-MM-DD');

            $http.get(`${CONFIG.apiUrl}/pharma/ip/${$scope.cboUserDrugLists}/${startDate}/${endDate}`)
            .then(res => {
                $scope.data = res.data;
            }, err => {
                console.log(err)
            });
        }
    }
]);
