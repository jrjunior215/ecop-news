<div class="container_crud_news px-3 pt-3">
    <div class="container_create">
        <a type="button" class="btn btn-primary" href="/admin-ecop/createnews">เพิ่มข่าว</a>
    </div>
    <div class="container_news border-top mt-2">
        <table class="table table-striped">
            <thead>
                <tr>
                    <th scope="col">#</th>
                    <th scope="col">หัวข้อ (ไทย)</th>
                    <th scope="col">เนื้อหา (ไทย)</th>
                    <th scope="col">หัวข้อ (อังกฤษ)</th>
                    <th scope="col">เนื้อหา (อังกฤษ)</th>
                    <th scope="col">ชื่อไฟล์รูปภาพ</th>
                    <th scope="col">วันที่</th>
                    <th scope="col" class="text-end">การดำเนินการ</th>
                </tr>
            </thead>
            <tbody id="newsTableBody">
                <tr class="align-middle">
                    <td>1</td>
                    <td>ข่าว</td>
                    <td>11/11/2024</td>
                    <td>
                        <div class="d-flex flex-row justify-content-end">
                            <a href="/admin-ecop/viewnews" type="button" class="btn btn-warning me-2">แก้ไข</a>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
    <nav>
        <ul class="pagination justify-content-center" id="pagination">
        </ul>
    </nav>
</div>
