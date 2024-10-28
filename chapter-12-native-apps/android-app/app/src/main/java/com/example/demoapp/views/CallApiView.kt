/*
 *  Copyright 2024 Curity AB
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

package com.example.demoapp.views

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.example.demoapp.CustomColors
import com.example.demoapp.R
import com.example.demoapp.utilities.CustomButton
import com.example.demoapp.utilities.TextHeading
import com.example.demoapp.utilities.TextOnColor
import com.example.demoapp.utilities.TextParagraph

@Composable
fun CallApiView(model: CallApiViewModel) {

    Column(
        modifier = Modifier
            .padding(bottom = 20.dp)
    ) {
        TextHeading(stringResource(id = R.string.call_apis_heading))
        TextParagraph(stringResource(id = R.string.call_apis_info))
        CustomButton(stringResource(id = R.string.call_apis_command), model::getApiData)

        if (model.orders.value != null) {
            val info = String.format(stringResource(R.string.call_apis_result), model.orders.value!!.size)
            TextOnColor(info)
        }

        if (model.error.value != null) {
            TextOnColor(model.error.value.toString(), CustomColors.red)
        }
    }
}