import * as React from 'react';
import { DraggableReactDialog } from './draggable-react-dialog';
import { isValidNumber, fieldIsStr, fieldIsTime } from '../../common/utils/base';


interface ForceValue {
    isDelete: boolean;
    value: string;
}

interface ForceValSetDialogOptions {
    variable?: any;
    variableType?: string | undefined;
}


abstract class BaseValSetDialog<T> extends DraggableReactDialog<any> {
    protected inputValue: string = '';
    protected validate_error: string = '';
    protected variable: any = {};
    protected variableType: string = '';

    protected changeValue(e: React.ChangeEvent<HTMLInputElement>): void {
        this.inputValue = e.target.value;
        this.validate_error = ''; // 清除之前的错误信息
        this.update();
    }

    protected validateValue(): void {
        if (!this.inputValue || this.inputValue.trim() === '') {
            this.validate_error = '请输入值';
            return;
        }

        if (this.variableType === 'program') {
            if (isNaN(Number(this.inputValue))
                && !fieldIsStr(this.inputValue)
                && !fieldIsTime(this.inputValue)
            ) {
                this.validate_error = '请输入数字或者Time类型数据';
            } else {
                this.validate_error = '';
            }
        } else {
            if (!isValidNumber(this.inputValue)) {
                this.validate_error = '请输入纯数字';
            } else {
                this.validate_error = '';
            }
        }
    }

    protected abstract override render(): React.ReactNode;

}


export class ForceValSetDialog extends BaseValSetDialog<ForceValue> {

    constructor({ variable, variableType }: ForceValSetDialogOptions = {}, title: string = '设置强制值') {
        super({ title });
        this.variable = variable;
        this.variableType = variableType || '';
        this.appendCloseButton('取消');

        // 添加删除强制值按钮
        const deleteButton = this.createButton('删除强制值');
        deleteButton.classList.add('secondary');
        this.controlPanel.appendChild(deleteButton);
        this.addAction(deleteButton, () => this.deleteForceValue(), 'click');

        this.appendAcceptButton('确定');
    }

    get value(): ForceValue {
        return {
            isDelete: false,
            value: this.inputValue
        };
    }

    protected render(): React.ReactNode {
        return (
            <div className='forceval-set-box'>
                <div className="form-body">
                    <div className="form-item">
                        <div className='form-label'>变量名</div>
                        <div className='form-value'>
                            <span>
                                {this.variable.abs_var || this.variable.variable || this.variable.absName}
                            </span>
                        </div>
                    </div>
                    <div className="form-item">
                        <div className='form-label'>当前强制值</div>
                        <div className='form-value'>
                            <span>{this.variable.force}</span>
                        </div>
                    </div>
                    <div className="form-item">
                        <div className="form-label">设置强制值</div>
                        <div className="form-input">
                            <input
                                className='theia-input'
                                value={this.inputValue}
                                placeholder="请输入强制值"
                                onChange={(e) => this.changeValue(e)} />
                        </div>
                    </div>
                    <div className="error">{this.validate_error}</div>
                </div>
            </div>
        );
    }


    protected override async accept(): Promise<void> {
        this.validateValue();
        if (this.validate_error) {
            this.update();
            return;
        }
        this.resolve && this.resolve({ isDelete: false, value: this.inputValue });
        this.dispose();
    }

    protected deleteForceValue(): void {
        if (this.resolve) {
            this.resolve({ isDelete: true, value: '' });
            this.dispose();
        }
    }

}

// 写入值设置对话框
export class WriteValueSetDialog extends BaseValSetDialog<string> {

    constructor({ variable, variableType }: ForceValSetDialogOptions = {}, title: string = '写入值设置') {
        super({ title });
        this.variable = variable;
        this.variableType = variableType || '';
        this.appendCloseButton('取消');
        this.appendAcceptButton('确定');
    }

    get value() {
        return this.inputValue
    }

    protected render(): React.ReactNode {
        return (
            <div className='forceval-set-box'>
                <div className="form-body">
                    <div className="form-item">
                        <div className='form-label'>变量名</div>
                        <div className='form-value'>
                            <span>
                                {this.variable.abs_var || this.variable.variable || this.variable.absName}
                            </span>
                        </div>
                    </div>
                    <div className="form-item">
                        <div className="form-label">写入值</div>
                        <div className="form-input">
                            <input
                                className='theia-input'
                                value={this.inputValue}
                                placeholder="请输入写入值"
                                onChange={(e) => this.changeValue(e)} />
                        </div>
                    </div>
                    <div className="error" style={{ padding: '0 8px' }}>{this.validate_error}</div>
                </div>
            </div>
        );
    }

    protected override async accept(): Promise<void> {
        this.validateValue();
        if (this.validate_error) {
            this.update();
            return;
        }
        this.resolve && this.resolve(this.inputValue);
        this.dispose();
    }

}
